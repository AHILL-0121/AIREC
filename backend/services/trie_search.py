class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.skill = None

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, skill: str) -> None:
        """Insert a skill into the trie"""
        node = self.root
        for char in skill.lower():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
        node.skill = skill
    
    def search(self, prefix: str) -> list:
        """Search for skills with the given prefix"""
        node = self.root
        for char in prefix.lower():
            if char not in node.children:
                return []
            node = node.children[char]
        
        results = []
        self._collect_skills(node, results)
        return results
    
    def _collect_skills(self, node: TrieNode, results: list) -> None:
        """Collect all skills from the current node and its children"""
        if node.is_end:
            results.append(node.skill)
        for child in node.children.values():
            self._collect_skills(child, results)

_skill_trie = None

def get_skill_trie() -> Trie:
    """Get the global skill trie, initializing with common skills if needed"""
    global _skill_trie
    if _skill_trie is None:
        _skill_trie = Trie()
        common_skills = [
            "JavaScript", "Python", "React", "Node.js", "MongoDB",
            "FastAPI", "Machine Learning", "Data Science", "AWS",
            "Docker", "Kubernetes", "TypeScript", "Next.js", "Java",
            "C#", "SQL", "PostgreSQL", "Git", "DevOps", "Agile",
            "Project Management", "Communication", "Leadership"
        ]
        for skill in common_skills:
            _skill_trie.insert(skill)
    return _skill_trie

async def initialize_trie_from_db():
    """Initialize the trie with skills from the database"""
    from utils.db import get_database
    
    db = get_database()
    trie = get_skill_trie()
    
    # Get skills from jobs
    jobs = await db.jobs.find().to_list(length=None)
    for job in jobs:
        for skill in job.get("required_skills", []):
            trie.insert(skill)
    
    # Get skills from users
    users = await db.users.find().to_list(length=None)
    for user in users:
        for skill in user.get("skills", []):
            trie.insert(skill)
    
    return trie

def search_skills(prefix: str, limit: int = 10) -> list:
    """Search for skills with the given prefix"""
    trie = get_skill_trie()
    results = trie.search(prefix)
    return results[:limit]