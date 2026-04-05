def get_roadmap_by_salary(salary):
    if salary <= 6:
        return {
            "level": "Beginner",
            "dsa": ["Arrays", "Strings", "Basic Recursion"],
            "subjects": ["DBMS Basics", "OS Basics"],
            "projects": ["Simple CRUD App"],
            "timeline": "2-3 months"
        }

    elif salary <= 12:
        return {
            "level": "Intermediate",
            "dsa": ["Trees", "Graphs", "Recursion", "Sorting"],
            "subjects": ["DBMS", "OS", "CN"],
            "projects": ["Full Stack App", "REST API"],
            "timeline": "4-6 months"
        }

    elif salary <= 25:
        return {
            "level": "Advanced",
            "dsa": ["DP", "Graphs", "Backtracking"],
            "subjects": ["OS Deep", "System Design Basics"],
            "projects": ["Scalable App", "Realtime Chat App"],
            "timeline": "6-8 months"
        }

    else:
        return {
            "level": "Elite",
            "dsa": ["Advanced DP", "Segment Trees", "CP"],
            "subjects": ["System Design", "Low Level Design"],
            "projects": ["Distributed Systems"],
            "timeline": "8-12 months"
        }