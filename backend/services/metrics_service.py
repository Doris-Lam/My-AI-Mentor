import re
import ast
from typing import Dict, Any


def calculate_code_metrics(code: str, language: str) -> Dict[str, Any]:
    """
    Calculate various code metrics for the given code.
    Returns a dictionary with metrics like lines of code, complexity, etc.
    """
    lines = code.split('\n')
    
    # Basic metrics
    total_lines = len(lines)
    blank_lines = sum(1 for line in lines if not line.strip())
    comment_lines = 0
    code_lines = 0
    
    # Language-specific comment patterns
    comment_patterns = {
        'python': [r'^\s*#', r'^\s*"""', r"^\s*'''"],
        'java': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'cpp': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'c': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'csharp': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'c#': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'go': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'rust': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'ruby': [r'^\s*#', r'^\s*=begin', r'^\s*=end'],
        'php': [r'^\s*//', r'^\s*#', r'^\s*/\*', r'^\s*\*'],
        'swift': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
        'kotlin': [r'^\s*//', r'^\s*/\*', r'^\s*\*'],
    }
    
    lang_key = language.lower()
    patterns = comment_patterns.get(lang_key, [r'^\s*#', r'^\s*//'])
    
    in_multiline_comment = False
    multiline_start = None
    
    for line in lines:
        stripped = line.strip()
        
        # Skip blank lines
        if not stripped:
            continue
        
        # Check for multiline comments
        if lang_key in ['python'] and ('"""' in stripped or "'''" in stripped):
            comment_lines += 1
            continue
        elif lang_key not in ['python'] and ('/*' in stripped or '*/' in stripped):
            comment_lines += 1
            continue
        
        # Check for single-line comments
        is_comment = any(re.match(pattern, line) for pattern in patterns)
        if is_comment:
            comment_lines += 1
        else:
            code_lines += 1
    
    # Function/class counting (language-specific)
    function_count = 0
    class_count = 0
    import_count = 0
    
    if lang_key == 'python':
        try:
            tree = ast.parse(code)
            function_count = len([node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)])
            class_count = len([node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)])
            import_count = len([node for node in ast.walk(tree) if isinstance(node, (ast.Import, ast.ImportFrom))])
        except:
            # Fallback to regex if AST parsing fails
            function_count = len(re.findall(r'^\s*def\s+\w+', code, re.MULTILINE))
            class_count = len(re.findall(r'^\s*class\s+\w+', code, re.MULTILINE))
            import_count = len(re.findall(r'^\s*(import|from)\s+', code, re.MULTILINE))
    elif lang_key in ['java', 'cpp', 'c', 'csharp', 'c#']:
        function_count = len(re.findall(r'(?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\(', code, re.MULTILINE))
        class_count = len(re.findall(r'^\s*(?:public|private|protected)?\s*class\s+\w+', code, re.MULTILINE))
        import_count = len(re.findall(r'^\s*(?:import|#include|using)', code, re.MULTILINE))
    elif lang_key == 'go':
        function_count = len(re.findall(r'^\s*func\s+\w+', code, re.MULTILINE))
        class_count = 0  # Go doesn't have classes
        import_count = len(re.findall(r'^\s*import\s+', code, re.MULTILINE))
    elif lang_key == 'rust':
        function_count = len(re.findall(r'^\s*(?:pub\s+)?fn\s+\w+', code, re.MULTILINE))
        class_count = len(re.findall(r'^\s*(?:pub\s+)?(?:struct|enum|trait)\s+\w+', code, re.MULTILINE))
        import_count = len(re.findall(r'^\s*use\s+', code, re.MULTILINE))
    else:
        # Generic fallback
        function_count = len(re.findall(r'function\s+\w+|def\s+\w+|fn\s+\w+', code, re.MULTILINE))
        class_count = len(re.findall(r'class\s+\w+', code, re.MULTILINE))
        import_count = len(re.findall(r'import\s+|from\s+', code, re.MULTILINE))
    
    # Calculate complexity (simple cyclomatic complexity approximation)
    # Count decision points: if, else, elif, for, while, switch, case, catch, &&, ||, ? (ternary)
    complexity_keywords = {
        'python': ['if', 'elif', 'else', 'for', 'while', 'except', 'and', 'or'],
        'java': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
        'cpp': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
        'c': ['if', 'else', 'for', 'while', 'switch', 'case', '&&', '||', '?'],
    }
    
    keywords = complexity_keywords.get(lang_key, ['if', 'else', 'for', 'while'])
    complexity = 1  # Base complexity
    for keyword in keywords:
        # Count occurrences (case-insensitive)
        pattern = r'\b' + re.escape(keyword) + r'\b'
        complexity += len(re.findall(pattern, code, re.IGNORECASE))
    
    # Calculate nesting depth (approximation)
    max_nesting = 0
    current_nesting = 0
    indent_chars = 0
    
    for line in lines:
        if not line.strip():
            continue
        
        # Count leading spaces/tabs
        leading_spaces = len(line) - len(line.lstrip())
        if leading_spaces > indent_chars:
            current_nesting += 1
            indent_chars = leading_spaces
        elif leading_spaces < indent_chars:
            current_nesting = max(0, current_nesting - 1)
            indent_chars = leading_spaces
        
        max_nesting = max(max_nesting, current_nesting)
    
    # Calculate code distribution percentages
    total_non_blank = code_lines + comment_lines
    code_percentage = (code_lines / total_non_blank * 100) if total_non_blank > 0 else 0
    comment_percentage = (comment_lines / total_non_blank * 100) if total_non_blank > 0 else 0
    
    # Calculate average line length
    non_blank_lines = [line for line in lines if line.strip()]
    avg_line_length = sum(len(line) for line in non_blank_lines) / len(non_blank_lines) if non_blank_lines else 0
    
    # Calculate longest line
    longest_line = max((len(line) for line in lines), default=0)
    
    return {
        "total_lines": total_lines,
        "code_lines": code_lines,
        "comment_lines": comment_lines,
        "blank_lines": blank_lines,
        "function_count": function_count,
        "class_count": class_count,
        "import_count": import_count,
        "complexity": complexity,
        "max_nesting_depth": max_nesting,
        "code_percentage": round(code_percentage, 2),
        "comment_percentage": round(comment_percentage, 2),
        "avg_line_length": round(avg_line_length, 2),
        "longest_line": longest_line,
        "characters": len(code),
        "characters_no_whitespace": len(re.sub(r'\s', '', code)),
    }

