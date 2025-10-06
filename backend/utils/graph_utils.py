import networkx as nx
from networkx.algorithms import bipartite

def calculate_edge_weight(candidate: dict, job: dict) -> float:
    """
    Calculate edge weight between candidate and job
    """
    candidate_skills = set([s.lower() for s in candidate.get("skills", [])])
    job_skills = set([s.lower() for s in job.get("required_skills", [])])
    
    # Skill match
    skill_overlap = len(candidate_skills & job_skills)
    skill_score = skill_overlap / len(job_skills) if job_skills else 0
    
    # Experience match
    candidate_exp = candidate.get("experience", 0)
    min_exp = job.get("min_experience", 0)
    max_exp = job.get("max_experience", 100)
    
    if min_exp <= candidate_exp <= max_exp:
        exp_score = 1.0
    else:
        exp_score = max(0, 1 - abs(candidate_exp - min_exp) * 0.1)
    
    # Combined weight (70% skills, 30% experience)
    weight = (skill_score * 0.7) + (exp_score * 0.3)
    return weight

def build_bipartite_graph(candidates: list, jobs: list):
    """
    Build bipartite graph with candidates on one side and jobs on the other
    """
    G = nx.Graph()
    
    # Add candidate nodes
    for candidate in candidates:
        candidate_id = str(candidate["_id"]) if "_id" in candidate else candidate["id"]
        G.add_node(candidate_id, bipartite=0, data=candidate)
    
    # Add job nodes
    for job in jobs:
        job_id = str(job["_id"]) if "_id" in job else job["id"]
        G.add_node(job_id, bipartite=1, data=job)
    
    # Add edges with weights
    for candidate in candidates:
        candidate_id = str(candidate["_id"]) if "_id" in candidate else candidate["id"]
        for job in jobs:
            job_id = str(job["_id"]) if "_id" in job else job["id"]
            weight = calculate_edge_weight(candidate, job)
            
            if weight > 0.3:  # Only add edges with >30% match
                G.add_edge(candidate_id, job_id, weight=weight)
    
    return G

def find_optimal_matches(graph):
    """
    Find maximum weighted matching in bipartite graph
    """
    # Get candidate and job nodes
    candidate_nodes = {n for n, d in graph.nodes(data=True) if d.get('bipartite') == 0}
    job_nodes = {n for n, d in graph.nodes(data=True) if d.get('bipartite') == 1}
    
    # Find maximum weighted matching
    matching = bipartite.maximum_matching(graph, top_nodes=candidate_nodes)
    
    # Extract matches with scores
    matches = []
    for candidate_id, job_id in matching.items():
        if candidate_id in candidate_nodes:
            if graph.has_edge(candidate_id, job_id):
                weight = graph[candidate_id][job_id]['weight']
                matches.append((candidate_id, job_id, weight))
    
    return matches
