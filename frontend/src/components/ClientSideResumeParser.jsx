import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Upload, Loader, AlertTriangle } from 'lucide-react';

/**
 * This is a client-side alternative to the backend resume parsing using Firebase and Google AI SDK
 * It allows us to call Gemini directly from the browser without needing a backend service
 * Note: You still need to configure Firebase and add your Google AI API key to Firebase
 */
const ClientSideResumeParser = ({ 
  file, 
  onStart, 
  onSuccess, 
  onError, 
  isProcessing = false 
}) => {
  const [pdfText, setPdfText] = useState("");
  const [isGeminiAvailable, setIsGeminiAvailable] = useState(false);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  
  // Check if Firebase and Google AI SDK are available
  useEffect(() => {
    const checkDependencies = async () => {
      try {
        // Check if the firebase/app and firebase/ai modules are available
        const firebaseApp = window.firebase?.app;
        const googleAI = window.firebaseai;
        
        if (firebaseApp && googleAI) {
          setIsFirebaseLoaded(true);
          
          try {
            // Check if Gemini API is available by initializing it
            const { getAI, getGenerativeModel, GoogleAIBackend } = googleAI;
            const ai = getAI(firebaseApp(), { backend: new GoogleAIBackend() });
            const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
            
            if (model) {
              setIsGeminiAvailable(true);
            }
          } catch (error) {
            console.error("Error checking Gemini availability:", error);
          }
        }
      } catch (error) {
        console.error("Firebase or GoogleAI not available:", error);
      }
    };
    
    checkDependencies();
  }, []);
  
  // Process the file when it changes
  useEffect(() => {
    const processFile = async () => {
      if (file && file.type === 'application/pdf' && isFirebaseLoaded) {
        try {
          const pdfJS = await import('pdfjs-dist/build/pdf');
          
          // Set PDF.js worker source
          pdfJS.GlobalWorkerOptions.workerSrc = 
            `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJS.version}/pdf.worker.js`;
          
          const reader = new FileReader();
          reader.onload = async (event) => {
            const typedArray = new Uint8Array(event.target.result);
            const pdf = await pdfJS.getDocument(typedArray).promise;
            
            let extractedText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(" ");
              extractedText += pageText + "\n";
            }
            
            setPdfText(extractedText);
          };
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.error("Error reading PDF:", error);
          if (onError) {
            onError("Failed to read PDF content. Please try again.");
          }
        }
      }
    };
    
    processFile();
  }, [file, isFirebaseLoaded, onError]);
  
  const parseResumeWithGemini = async () => {
    if (!isFirebaseLoaded || !isGeminiAvailable || !pdfText) {
      if (onError) {
        onError("Gemini AI is not available or PDF text couldn't be extracted");
      }
      return;
    }
    
    if (onStart) {
      onStart();
    }
    
    try {
      // Firebase and Google AI initialization
      const { getAI, getGenerativeModel, GoogleAIBackend } = window.firebaseai;
      const firebaseApp = window.firebase.app();
      const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
      
      // Truncate PDF text if too long (Gemini has input limits)
      const truncatedText = pdfText.substring(0, 5000);
      
      // Create the prompt
      const prompt = `Extract key information from this resume text.
        
Resume text:
${truncatedText}

Extract and return ONLY a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience_years": 0,
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": ""
    }
  ],
  "achievements": ["achievement1"],
  "job_titles": ["title1"]
}

Format your entire response as valid JSON only. No explanations, no other text.`;
      
      // Initialize the model
      const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();
      
      // Parse the JSON response
      let jsonResponse;
      try {
        // Try to extract JSON if it's wrapped in code blocks
        let jsonText = responseText;
        
        if (jsonText.includes("```json")) {
          jsonText = jsonText.split("```json")[1].split("```")[0].trim();
        } else if (jsonText.includes("```")) {
          jsonText = jsonText.split("```")[1].split("```")[0].trim();
        }
        
        // Attempt to parse JSON
        jsonResponse = JSON.parse(jsonText);
        
        // Add parsing method info
        jsonResponse.parsing_method = "client_side_gemini";
        
        // Pass parsed data to parent component
        if (onSuccess) {
          onSuccess(jsonResponse);
        }
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        if (onError) {
          onError("Failed to parse Gemini AI response");
        }
      }
    } catch (error) {
      console.error("Error using Gemini API:", error);
      if (onError) {
        onError("Failed to process resume with Gemini AI");
      }
    }
  };

  return (
    <div className="space-y-4">
      {!isFirebaseLoaded && (
        <div className="flex items-center bg-amber-50 text-amber-600 p-3 rounded-md">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Firebase not loaded. This feature requires Firebase setup.</span>
        </div>
      )}
      
      {isFirebaseLoaded && !isGeminiAvailable && (
        <div className="flex items-center bg-amber-50 text-amber-600 p-3 rounded-md">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Gemini API not available. Check your Firebase configuration.</span>
        </div>
      )}
      
      {file && pdfText && (
        <Button 
          className="w-full" 
          onClick={parseResumeWithGemini} 
          disabled={isProcessing || !isGeminiAvailable}
        >
          {isProcessing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Parsing Resume with Client-Side AI...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Parse with Client-Side Gemini AI
            </>
          )}
        </Button>
      )}
      
      {file && !pdfText && isFirebaseLoaded && (
        <div className="flex items-center bg-blue-50 text-blue-600 p-3 rounded-md">
          <Loader className="h-5 w-5 mr-2 animate-spin" />
          <span>Processing PDF file, please wait...</span>
        </div>
      )}
    </div>
  );
};

export default ClientSideResumeParser;