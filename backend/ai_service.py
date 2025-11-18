import google.generativeai as genai
import re
from config import get_settings

settings = get_settings()

# Language mapping for code blocks and prompts
language_map = {
    'python': 'python',
    'java': 'java',
    'ruby': 'ruby',
    'php': 'php',
    'cpp': 'cpp',
    'c++': 'cpp',
    'c': 'c',
    'csharp': 'csharp',
    'c#': 'csharp',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'go': 'go',
    'rust': 'rust',
    'swift': 'swift',
    'kotlin': 'kotlin',
}

display_names = {
    'python': 'Python',
    'java': 'Java',
    'ruby': 'Ruby',
    'php': 'PHP',
    'cpp': 'C++',
    'c': 'C',
    'csharp': 'C#',
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'go': 'Go',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
}

# Configure Gemini (with fallback for missing API key)
try:
    if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
    else:
        model = None
except Exception:
    model = None


def parse_score(score_text: str) -> dict:
    """
    Parse score text from AI response.
    Expected format: correctness_score|clarity_score|best_practices_score|performance_score|overall_score
    Example: 85|90|75|80|82
    """
    default_scores = {
        "correctness_score": 100,
        "clarity_score": 100,
        "best_practices_score": 100,
        "performance_score": 100,
        "overall_score": 100
    }
    
    if not score_text or score_text == "No information provided.":
        return default_scores
    
    # Try to find score line (pipe-separated format)
    lines = score_text.split('\n')
    for line in lines:
        line = line.strip()
        # Check if line has pipe-separated numbers
        if '|' in line and all(part.strip().isdigit() for part in line.split('|')):
            parts = line.split('|')
            if len(parts) >= 5:
                try:
                    return {
                        "correctness_score": int(parts[0].strip()),
                        "clarity_score": int(parts[1].strip()),
                        "best_practices_score": int(parts[2].strip()),
                        "performance_score": int(parts[3].strip()),
                        "overall_score": int(parts[4].strip())
                    }
                except ValueError:
                    pass
    
    # Fallback: try to calculate from errors and suggestions if available
    # This is a simple heuristic - we'll use defaults if we can't parse
    return default_scores


async def analyze_code(code: str, language: str, format: bool = False) -> dict:
    """
    Analyzes code using Google Gemini AI and returns structured feedback.
    """
    
    # Normalize language code
    normalized_lang = language_map.get(language.lower(), language.lower())
    
    # Get display name for prompts
    display_name = display_names.get(normalized_lang, normalized_lang.capitalize())
    
    if format:
        prompt = f"""
You are an expert code formatter. Format the following {display_name} code with proper indentation, spacing, and style.

Code to format:
```{normalized_lang}
{code}
```

Format your response EXACTLY as follows:

FORMATTED_CODE:
[provide the properly formatted code with correct indentation, spacing, and style]

Focus on:
- Proper indentation (2 or 4 spaces consistently)
- Consistent spacing around operators
- Proper line breaks and alignment
- Following {display_name} style conventions
- Clean, readable structure
"""
    else:
        prompt = f"""
You are an expert coding mentor specializing in {display_name}. Analyze the COMPLETE code below and provide comprehensive, contextual feedback.

IMPORTANT: Analyze ALL parts of the code - every line, function, class, and structure. Consider the code as a whole and understand the relationships between different parts.

Code to analyze (COMPLETE CODE):
```{normalized_lang}
{code}
```

Analysis Requirements:
1. **Read and understand the ENTIRE code** - don't skip any lines or sections
2. **Consider context** - understand how different parts relate to each other
3. **Provide meaningful suggestions** - suggestions must make sense in the context of the entire codebase
4. **Be specific** - include exact line numbers and the actual code that needs to change
5. **Explain why** - each suggestion should explain why it improves the code

Format your response EXACTLY as follows:

ERRORS:
[list any syntax errors, logical errors, or runtime issues - one per line with line number]
[Format: "line X: error description" or "line X-Y: error description"]

SUGGESTIONS:
[list specific improvements in this format: "line X: original_text -> suggested_text" or "line X: description of issue with context"]
[IMPORTANT: Only suggest changes that make sense in the context of the entire code. Include enough context to understand why the suggestion is needed.]

TEST_CASES:
[generate 3-5 practical test cases with edge cases that test the complete functionality]

EXPLANATION:
[clear explanation of:
1. What the code does as a whole
2. The overall structure and flow
3. How different parts work together
4. Specific areas for improvement with context
5. Why each suggestion improves the code]

SCORE:
Provide a numerical score out of 100 and breakdown across these categories (each 0-100):
- correctness_score: Based on syntax errors, logical errors, and runtime issues
- clarity_score: Based on code readability, naming conventions, and documentation
- best_practices_score: Based on following {display_name} language conventions, design patterns, and standards
- performance_score: Based on efficiency, optimization opportunities, and resource usage

Format as: correctness_score|clarity_score|best_practices_score|performance_score|overall_score
Example: 85|90|75|80|82

Guidelines for suggestions:
- Only suggest changes that are contextually appropriate
- Consider the entire code structure before suggesting changes
- Ensure suggestions are practical and implementable
- Avoid suggesting changes that would break existing functionality
- Make sure suggested code fits the existing code style and patterns
- Explain the reasoning behind each suggestion
- Focus on improvements that add real value

Pay special attention to {display_name}-specific syntax, conventions, and best practices while considering the complete code context.
"""

    try:
        # Check if Gemini is available
        if model is None:
            return {
                "errors": "No AI service configured. Please set GEMINI_API_KEY in your .env file.",
                "suggestions": "To enable AI analysis, add your Gemini API key to the .env file.",
                "test_cases": "AI test case generation requires a valid API key.",
                "explanation": "AI explanation requires a valid API key.",
                "correctness_score": 0,
                "clarity_score": 0,
                "best_practices_score": 0,
                "performance_score": 0,
                "overall_score": 0
            }
        
        # Use Gemini API with higher token limit for comprehensive analysis
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,  # Lower temperature for more focused, accurate suggestions
                max_output_tokens=4000,  # Increased for comprehensive analysis of full code
                top_p=0.95,
                top_k=40,
            )
        )
        content = response.text
        
        if format:
            # Parse formatted code response
            lines = content.split('\n')
            formatted_code = ""
            in_formatted_section = False
            
            for line in lines:
                line_upper = line.strip().upper()
                if line_upper.startswith('FORMATTED_CODE:'):
                    in_formatted_section = True
                    continue
                elif in_formatted_section and line.strip():
                    formatted_code += line + "\n"
            
            return {
                "formatted_code": formatted_code.strip() if formatted_code else code,
                "errors": "No errors found.",
                "suggestions": "Code formatted successfully.",
                "test_cases": "No test cases needed for formatting.",
                "explanation": "Code has been formatted with proper indentation and style."
            }
        else:
            # Parse the response into sections
            sections = {
                "errors": "",
                "suggestions": "",
                "test_cases": "",
                "explanation": "",
                "score": ""
            }
            
            current_section = None
            lines = content.split('\n')
            
            for line in lines:
                line_upper = line.strip().upper()
                if line_upper.startswith('ERRORS:'):
                    current_section = "errors"
                    continue
                elif line_upper.startswith('SUGGESTIONS:'):
                    current_section = "suggestions"
                    continue
                elif line_upper.startswith('TEST_CASES:') or line_upper.startswith('TEST CASES:'):
                    current_section = "test_cases"
                    continue
                elif line_upper.startswith('EXPLANATION:'):
                    current_section = "explanation"
                    continue
                elif line_upper.startswith('SCORE:'):
                    current_section = "score"
                    continue
                
                if current_section:
                    sections[current_section] += line + "\n"
            
            # Clean up sections
            for key in sections:
                sections[key] = sections[key].strip()
                if not sections[key]:
                    sections[key] = "No information provided."
            
            # Parse score if available
            score_data = parse_score(sections["score"])
            sections.update(score_data)
            
            return sections
        
    except Exception as e:
        return {
            "errors": f"Error communicating with Gemini AI: {str(e)}",
            "suggestions": "Unable to generate suggestions due to API error.",
            "test_cases": "Unable to generate test cases due to API error.",
            "explanation": "Unable to generate explanation due to API error.",
            "correctness_score": 0,
            "clarity_score": 0,
            "best_practices_score": 0,
            "performance_score": 0,
            "overall_score": 0
        }


async def generate_code(prompt: str, language: str, context: str = None) -> dict:
    """
    Generate code based on a natural language prompt.
    """
    if not model:
        return {
            "generated_code": f"# AI service not configured. Please set GEMINI_API_KEY.\n# Requested: {prompt}",
            "explanation": "AI service is not configured. Please set your GEMINI_API_KEY environment variable."
        }
    
    try:
        # Build the prompt for code generation
        system_prompt = f"""You are an expert {language} developer. Generate clean, well-documented code based on the user's request.

Requirements:
- Write clean, production-ready {language} code
- Include helpful comments
- Follow {language} best practices
- Make the code easy to understand
- If the user asks for a function, include a simple example of how to use it

"""
        
        if context:
            system_prompt += f"Context (existing code):\n```{language}\n{context}\n```\n\n"
        
        system_prompt += f"User request: {prompt}\n\nGenerate the {language} code:"
        
        response = model.generate_content(system_prompt)
        generated_code = response.text.strip()
        
        # Extract code blocks if present
        if "```" in generated_code:
            # Extract code from markdown code blocks
            import re
            code_blocks = re.findall(r'```(?:python|ruby|php|java|go|rust|c\+\+|c|' + language.lower() + r')?\n(.*?)```', generated_code, re.DOTALL)
            if code_blocks:
                generated_code = code_blocks[0].strip()
            else:
                # Try to extract any code block
                code_blocks = re.findall(r'```\n?(.*?)```', generated_code, re.DOTALL)
                if code_blocks:
                    generated_code = code_blocks[0].strip()
        
        # Generate explanation
        explanation_prompt = f"Explain what this {language} code does in one sentence:\n\n```{language}\n{generated_code}\n```"
        explanation_response = model.generate_content(explanation_prompt)
        explanation = explanation_response.text.strip()
        
        return {
            "generated_code": generated_code,
            "explanation": explanation
        }
    
    except Exception as e:
        print(f"Error generating code: {e}")
        return {
            "generated_code": f"# Error generating code: {str(e)}",
            "explanation": f"An error occurred while generating code: {str(e)}"
        }


async def visualize_code(code: str, language: str) -> dict:
    """
    Visualize code execution flow and explain how the code works step by step.
    """
    if not model:
        return {
            "steps": [],
            "explanation": "AI service is not configured. Please set your GEMINI_API_KEY environment variable.",
            "flow_diagram": None
        }
    
    try:
        normalized_lang = language_map.get(language.lower(), language.lower())
        display_name = display_names.get(normalized_lang, normalized_lang.capitalize())
        
        prompt = f"""You are an expert code visualizer and educator. Analyze the following {display_name} code and create a step-by-step visualization of how it executes.

Code to visualize:
```{normalized_lang}
{code}
```

Create a detailed step-by-step execution flow. For each step, provide:
1. **Line number(s)** being executed
2. **What happens** at this step
3. **Variable states** (if any variables are created, modified, or used)
4. **Function calls** (if any functions are called)
5. **Control flow** (if statements, loops, etc.)
6. **Output** (if anything is printed or returned)

Format your response EXACTLY as follows:

STEPS:
Step 1: [Line X] - [Description of what happens]
  Variables: [variable_name = value, ...]
  Action: [What the code does]
  Output: [Any output or return value]

Step 2: [Line Y] - [Description]
  Variables: [variable_name = value, ...]
  Action: [What the code does]
  Output: [Any output or return value]

[Continue for all execution steps...]

EXPLANATION:
[Overall explanation of how the code works, including:
- Entry point
- Main execution flow
- Key concepts demonstrated
- How different parts interact]

FLOW_DIAGRAM:
[Optional: A simple text-based flow diagram showing the execution path]

Focus on making it easy to understand for someone learning to code. Show the exact order of execution and how data flows through the program.
"""
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.5,
                max_output_tokens=4000,
                top_p=0.95,
                top_k=40,
            )
        )
        content = response.text
        
        # Parse the response
        sections = {
            "steps": [],
            "explanation": "",
            "flow_diagram": None
        }
        
        current_section = None
        lines = content.split('\n')
        current_step = None
        
        for line in lines:
            line_upper = line.strip().upper()
            
            if line_upper.startswith('STEPS:'):
                current_section = "steps"
                continue
            elif line_upper.startswith('EXPLANATION:'):
                current_section = "explanation"
                continue
            elif line_upper.startswith('FLOW_DIAGRAM:'):
                current_section = "flow_diagram"
                continue
            
            if current_section == "steps":
                # Parse step lines
                if line.strip().startswith('Step ') and ':' in line:
                    # Save previous step if exists
                    if current_step:
                        sections["steps"].append(current_step)
                    
                    # Start new step
                    step_match = re.match(r'Step (\d+):\s*\[Line (\d+)(?:-(\d+))?\]\s*-\s*(.+)', line.strip())
                    if step_match:
                        current_step = {
                            "step_number": int(step_match.group(1)),
                            "line_number": int(step_match.group(2)),
                            "line_end": int(step_match.group(3)) if step_match.group(3) else None,
                            "description": step_match.group(4).strip(),
                            "variables": {},
                            "action": "",
                            "output": ""
                        }
                    else:
                        # Fallback parsing
                        parts = line.split(':')
                        if len(parts) >= 2:
                            step_num = parts[0].replace('Step', '').strip()
                            desc = ':'.join(parts[1:]).strip()
                            current_step = {
                                "step_number": int(step_num) if step_num.isdigit() else len(sections["steps"]) + 1,
                                "line_number": len(sections["steps"]) + 1,
                                "description": desc,
                                "variables": {},
                                "action": "",
                                "output": ""
                            }
                elif current_step:
                    # Parse step details
                    if line.strip().startswith('Variables:'):
                        vars_text = line.split('Variables:')[1].strip()
                        # Simple parsing - can be improved
                        current_step["variables"] = vars_text
                    elif line.strip().startswith('Action:'):
                        current_step["action"] = line.split('Action:')[1].strip()
                    elif line.strip().startswith('Output:'):
                        current_step["output"] = line.split('Output:')[1].strip()
                    elif line.strip() and not line.strip().startswith('Step '):
                        # Additional description
                        if not current_step["action"]:
                            current_step["action"] = line.strip()
                        else:
                            current_step["action"] += " " + line.strip()
            
            elif current_section == "explanation":
                sections["explanation"] += line + "\n"
            
            elif current_section == "flow_diagram":
                if sections["flow_diagram"] is None:
                    sections["flow_diagram"] = ""
                sections["flow_diagram"] += line + "\n"
        
        # Add last step
        if current_step:
            sections["steps"].append(current_step)
        
        # Clean up sections
        sections["explanation"] = sections["explanation"].strip()
        if sections["flow_diagram"]:
            sections["flow_diagram"] = sections["flow_diagram"].strip()
        
        return sections
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error visualizing code: {str(e)}")
        print(f"Traceback: {error_trace}")
        return {
            "steps": [],
            "explanation": f"Error visualizing code: {str(e)}",
            "flow_diagram": None
        }


async def generate_diagram(code: str, language: str) -> dict:
    """
    Generate a visual diagram (Mermaid format) representing the code structure.
    Can generate flowcharts, class diagrams, sequence diagrams, etc.
    """
    if not model:
        return {
            "diagram_code": "",
            "diagram_type": "flowchart",
            "explanation": "AI service is not configured. Please set your GEMINI_API_KEY environment variable."
        }
    
    try:
        normalized_lang = language_map.get(language.lower(), language.lower())
        display_name = display_names.get(normalized_lang, normalized_lang.capitalize())
        
        prompt = f"""You are an expert code analyzer and visualizer. Analyze the following {display_name} code and create a Mermaid diagram that visually represents its structure.

Code to analyze:
```{normalized_lang}
{code}
```

Create a Mermaid diagram that best represents this code. Choose the most appropriate diagram type:
- **flowchart TD** (Top-Down flowchart) - for execution flow, algorithms, control flow
- **classDiagram** - for object-oriented code with classes and relationships
- **sequenceDiagram** - for showing interactions between objects/functions over time
- **graph LR** (Left-Right graph) - for data flow, dependencies, relationships

Your response MUST be in this EXACT format:

DIAGRAM_TYPE:
[flowchart TD | classDiagram | sequenceDiagram | graph LR]

DIAGRAM_CODE:
```mermaid
[Your complete Mermaid diagram code here]
```

EXPLANATION:
[A brief explanation of what the diagram shows and how it represents the code structure]

CRITICAL SYNTAX REQUIREMENTS:
1. **Flowchart syntax**: Use proper node definitions like `A[Label]` or `A{{Label}}` or `A((Label))` or `A>Label]`
2. **Arrow syntax**: Use `-->` for arrows, NOT `.->` or other variations
3. **Node IDs**: Must be alphanumeric, no spaces or special characters (use underscores)
4. **Labels**: Can contain spaces and special characters when in quotes or brackets
5. **Class diagrams**: MUST use ONE of these formats:
   - Format 1 (compact): `class ClassName {{ +methodName() -attributeName }}`
   - Format 2 (separate): `ClassName : +methodName()` and `ClassName : -attributeName` on separate lines
   - DO NOT mix formats or use `{{ }}` syntax for class diagrams
   - DO NOT use `:` inside class definitions (Format 1) - use `-string attributeName` not `-attributeName : string`
   - Notes: Use `note for ClassName "Note text"` (note MUST be on its own line, NO colon after class name, and MUST have quotes around the text)
   - DO NOT mix class diagrams with execution flow - class diagrams show structure, not execution
6. **Sequence diagrams**: Use proper participant and message syntax
7. **No trailing commas** or invalid characters
8. **Proper indentation** for readability
9. **Each line must be complete** - do not split class definitions across lines incorrectly

Example valid flowchart:
```mermaid
flowchart TD
    Start([Start]) --> Process[Process Data]
    Process --> Decision{{Decision?}}
    Decision -->|Yes| Action1[Action 1]
    Decision -->|No| Action2[Action 2]
    Action1 --> End([End])
    Action2 --> End
```

Example valid class diagram (Format 1):
```mermaid
classDiagram
    class HelloWorld {{
        -string message
        +__init__()
        +greet()
    }}
```

Example valid class diagram (Format 2):
```mermaid
classDiagram
    class HelloWorld
    HelloWorld : -string message
    HelloWorld : +__init__()
    HelloWorld : +greet()
```

IMPORTANT: Choose ONE format and stick with it. Do NOT mix formats or add invalid syntax.

Guidelines:
1. Use clear, descriptive node labels
2. Show relationships, inheritance, dependencies, or execution flow
3. Use appropriate Mermaid syntax and styling
4. Make it visually informative and easy to understand
5. Include all important components (classes, functions, variables, control flow, etc.)
6. **ALWAYS validate your Mermaid syntax before outputting**

Focus on making the diagram educational and helpful for understanding the code structure at a glance. Ensure the syntax is 100% valid for Mermaid version 11.x.
"""
        
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=4000,
                    top_p=0.95,
                    top_k=40,
                )
            )
            content = response.text
        except Exception as api_error:
            error_str = str(api_error)
            # Check for rate limit errors
            if '429' in error_str or 'Resource exhausted' in error_str or 'quota' in error_str.lower():
                raise Exception(
                    "Rate limit exceeded: You've hit the API rate limit. "
                    "Please wait a few minutes before trying again. "
                    "If this persists, check your Google Cloud quota settings."
                )
            # Re-raise other errors
            raise
        
        # Parse the response
        diagram_type = "flowchart TD"
        diagram_code = ""
        explanation = ""
        
        current_section = None
        in_code_block = False
        
        for line in content.split('\n'):
            line_stripped = line.strip()
            
            # Detect sections
            if line_stripped.startswith('DIAGRAM_TYPE:'):
                current_section = "diagram_type"
                continue
            elif line_stripped.startswith('DIAGRAM_CODE:'):
                current_section = "diagram_code"
                continue
            elif line_stripped.startswith('EXPLANATION:'):
                current_section = "explanation"
                continue
            elif line_stripped.startswith('```mermaid'):
                in_code_block = True
                continue
            elif line_stripped.startswith('```') and in_code_block:
                in_code_block = False
                continue
            
            # Process sections
            if current_section == "diagram_type" and line_stripped:
                diagram_type = line_stripped
                current_section = None  # Only one line expected
            
            elif current_section == "diagram_code" or in_code_block:
                if line_stripped and not line_stripped.startswith('```'):
                    diagram_code += line + "\n"
            
            elif current_section == "explanation":
                explanation += line + "\n"
        
        # Clean up
        diagram_code = diagram_code.strip()
        explanation = explanation.strip()
        
        # If no diagram code was extracted, try to find it in the raw response
        if not diagram_code:
            # Look for mermaid code blocks
            mermaid_match = re.search(r'```mermaid\s*\n(.*?)\n```', content, re.DOTALL)
            if mermaid_match:
                diagram_code = mermaid_match.group(1).strip()
            
            # If still no code, try to find any code block
            if not diagram_code:
                code_match = re.search(r'```\s*\n(.*?)\n```', content, re.DOTALL)
                if code_match:
                    diagram_code = code_match.group(1).strip()
        
        # Clean and validate diagram code
        if diagram_code:
            # Remove any incomplete lines (lines that seem cut off)
            lines = diagram_code.split('\n')
            cleaned_lines = []
            seen_class_definitions = set()
            
            for line in lines:
                line = line.strip()
                # Skip empty lines
                if not line:
                    continue
                
                # Split lines where notes are attached (e.g., "greet()note for Main: ..." or "createsnote for Main: ...")
                pending_note = None
                # Look for "note" followed by "for", "right of", or "left of"
                # Match "note" even if attached without space (e.g., "greet()note" or "createsnote")
                # Pattern matches: start of line, space, closing paren, or word boundary before "note"
                # First try pattern with separator (space or paren)
                note_pattern1 = r'(^|\s|\))note\s+(?:for|right\s+of|left\s+of)\s+'
                note_match = re.search(note_pattern1, line, re.IGNORECASE)
                note_start_pos = None
                # If not found, try pattern for directly attached "note" (like "createsnote")
                if not note_match:
                    note_pattern2 = r'(\w+)note\s+(?:for|right\s+of|left\s+of)\s+'
                    note_match = re.search(note_pattern2, line, re.IGNORECASE)
                    if note_match:
                        # "note" is directly attached to a word
                        note_start_pos = note_match.start() + len(note_match.group(1))
                else:
                    # "note" has a separator before it
                    note_pos = note_match.start()
                    before_note = note_match.group(1)
                    if before_note in [' ', ')']:
                        note_start_pos = note_pos + len(before_note)
                    else:
                        note_start_pos = note_pos
                
                if note_match and note_start_pos is not None and not line.strip().startswith('note '):
                    if note_start_pos > 0:
                        # Split into two lines
                        main_line = line[:note_start_pos].strip()
                        note_line = line[note_start_pos:].strip()
                        # Ensure note_line starts with "note "
                        if not note_line.startswith('note '):
                            note_line = 'note ' + note_line[4:] if note_line.startswith('note') else note_line
                        # Process the main line first (if it exists)
                        if main_line:
                            # Process main_line in this iteration
                            line = main_line
                            # Store note_line to be processed after main_line
                            pending_note = note_line
                        else:
                            # Only note, process it
                            line = note_line
                
                # Skip lines that look incomplete (end with incomplete syntax)
                if line.endswith(' :') or line.endswith(' : +') or line.endswith(' : -'):
                    continue
                
                # Fix note syntax - must have quotes and be on its own line
                # Mermaid format: note for ClassName "text" (NO colon after class name!)
                if 'note ' in line.lower():
                    # Check if note is on its own line
                    if not line.strip().startswith('note '):
                        # Note is attached to previous line - skip it
                        continue
                    # Fix note syntax: remove colon after class name if present
                    # Format should be: note for ClassName "text" (not note for ClassName: "text")
                    if ':' in line:
                        # Split on colon to get class name and note text
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            note_prefix = parts[0].strip()  # "note for ClassName"
                            note_text = parts[1].strip()
                            # If note text doesn't have quotes, add them
                            if not note_text.startswith('"') or not note_text.endswith('"'):
                                # Fix the note by adding quotes
                                line = note_prefix + ' "' + note_text + '"'
                            else:
                                # Note has quotes, but check for newlines inside
                                # Remove quotes to work with the text
                                note_text_content = note_text[1:-1]  # Remove surrounding quotes
                                # First handle escaped newlines, then actual newlines
                                if '\\n' in note_text_content:
                                    note_text_content = note_text_content.replace('\\n', ' ')
                                # Also handle actual newlines (if any)
                                if '\n' in note_text_content:
                                    note_text_content = note_text_content.replace('\n', ' ')
                                # Rebuild the line with cleaned text (NO colon!)
                                line = note_prefix + ' "' + note_text_content + '"'
                    else:
                        # Note syntax is invalid, skip it
                        continue
                
                # Fix class diagram attribute syntax - convert `-attribute : type` or `-attribute: type` to `-type attribute`
                # Check if this is inside a class definition (Format 1)
                if cleaned_lines and any(l.startswith('class ') and '{' in l for l in cleaned_lines[-5:]):
                    # Check for wrong attribute syntax: `-attribute: type` or `-attribute : type`
                    if re.match(r'^\s*[-+]\s*\w+\s*:?\s*\w+', line) and ':' in line and not line.startswith('note '):
                        match = re.match(r'^\s*([-+])\s*(\w+)\s*:?\s*(\w+)', line)
                        if match:
                            visibility = match.group(1)
                            attr_name = match.group(2)
                            attr_type = match.group(3)
                            # Check if this is a relationship (capitalized type suggests a class name)
                            if attr_type[0].isupper() and len(attr_type) > 1:
                                # This is likely a relationship, skip it (relationships should be defined separately)
                                continue
                            # Fix the syntax: convert `-attribute: type` to `-type attribute`
                            line = f'    {visibility}{attr_type} {attr_name}'
                
                # Remove execution flow lines from class diagrams (lines like "Main : obj = HelloWorld()")
                if ' : ' in line and not line.startswith('note ') and not line.startswith('class '):
                    # Check if this looks like execution flow (contains = or .)
                    if '=' in line or ('.' in line and '(' in line and ')' in line):
                        # This is execution flow, not class structure - skip it
                        continue
                
                # For class diagrams, remove duplicate class definitions
                if line.startswith('class '):
                    # Extract class name
                    parts = line.split()
                    if len(parts) >= 2:
                        class_name = parts[1].split('{')[0]  # Get name before {
                        if class_name in seen_class_definitions:
                            # Skip duplicate class definition
                            continue
                        seen_class_definitions.add(class_name)
                
                # Remove duplicate attribute/method definitions (if class already has them in {})
                if ' : ' in line and cleaned_lines:
                    # Check if this is a duplicate of something already in a class definition
                    class_name = line.split(' : ')[0].strip()
                    if class_name in seen_class_definitions:
                        # Check if we already have a class definition with {}
                        has_class_def = any(
                            l.startswith(f'class {class_name}') and '{' in l 
                            for l in cleaned_lines
                        )
                        if has_class_def:
                            # Skip this line as it's already in the class definition
                            continue
                
                # Add the line if it passed all checks
                cleaned_lines.append(line)
                
                # If there's a pending note, process it now
                if pending_note:
                    # Process the note line
                    note_line = pending_note
                    # Fix note syntax - must have quotes and NO colon after class name
                    # Mermaid format: note for ClassName "text" (not note for ClassName: "text")
                    if ':' in note_line:
                        parts = note_line.split(':', 1)
                        if len(parts) == 2:
                            note_prefix = parts[0].strip()  # "note for ClassName"
                            note_text = parts[1].strip()
                            # If note text doesn't have quotes, add them
                            if not note_text.startswith('"') or not note_text.endswith('"'):
                                # Fix the note by adding quotes
                                note_line = note_prefix + ' "' + note_text + '"'
                            else:
                                # Note has quotes, but check for newlines inside
                                # Remove quotes to work with the text
                                note_text_content = note_text[1:-1]  # Remove surrounding quotes
                                # First handle escaped newlines, then actual newlines
                                if '\\n' in note_text_content:
                                    note_text_content = note_text_content.replace('\\n', ' ')
                                # Also handle actual newlines (if any)
                                if '\n' in note_text_content:
                                    note_text_content = note_text_content.replace('\n', ' ')
                                # Rebuild the note line with cleaned text (NO colon!)
                                note_line = note_prefix + ' "' + note_text_content + '"'
                    # Add the note line
                    cleaned_lines.append(note_line)
            
            diagram_code = '\n'.join(cleaned_lines)
        
        # Default diagram if nothing was found
        if not diagram_code:
            diagram_code = """flowchart TD
    Start[Start] --> End[End]"""
            explanation = "Could not generate diagram. Please check your code."
        
        return {
            "diagram_code": diagram_code,
            "diagram_type": diagram_type,
            "explanation": explanation or "Diagram generated successfully."
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error generating diagram: {str(e)}")
        print(f"Traceback: {error_trace}")
        return {
            "diagram_code": """flowchart TD
    Error[Error generating diagram] --> End[Please try again]""",
            "diagram_type": "flowchart TD",
            "explanation": f"Error generating diagram: {str(e)}"
        }


async def generate_lesson(code: str, language: str) -> dict:
    """
    Generate an educational lesson teaching the core concepts and algorithms in the code.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        display_name = display_names.get(language.lower(), language.capitalize())
        normalized_lang = language_map.get(language.lower(), language.lower())
        
        prompt = f"""You are an expert programming instructor. Analyze the following {display_name} code and create a comprehensive educational lesson that TEACHES the core programming concepts, algorithms, and patterns - NOT just what the code does, but the underlying concepts themselves.

Code to analyze:
```{normalized_lang}
{code}
```

Your goal is to TEACH concepts, not explain execution. Create a lesson that:

1. **Identifies and Teaches Core Concepts**: 
   - What programming concepts are being used? (e.g., Object-Oriented Programming, Functional Programming, Recursion, Iteration, etc.)
   - Explain each concept as if teaching it for the first time
   - Use analogies and examples to make concepts clear

2. **Teaches Algorithms and Data Structures**:
   - If there are algorithms (sorting, searching, graph traversal, dynamic programming, etc.), teach HOW the algorithm works conceptually
   - Explain the algorithm's approach, time/space complexity, and when to use it
   - If data structures are used (arrays, lists, trees, graphs, hash tables, etc.), explain what they are and why they're chosen

3. **Teaches Design Patterns and Techniques**:
   - Identify any design patterns (Singleton, Factory, Observer, Strategy, etc.) and explain the pattern itself
   - Explain common programming techniques and best practices used
   - Teach why these patterns/techniques are useful in general

4. **Conceptual Understanding**:
   - Focus on the "why" and "when" - not just the "what"
   - Explain the theoretical foundations behind the code
   - Connect concepts to broader programming principles

5. **Educational Structure**:
   - Start with an overview of what concepts will be learned
   - Break down each concept with clear explanations
   - Use examples and analogies
   - End with key takeaways and practice suggestions

IMPORTANT: This is a CONCEPT lesson, not a code walkthrough. Focus on teaching the underlying concepts, algorithms, and patterns that someone could apply to other code. Don't just explain what this specific code does - teach the concepts so they can understand similar code elsewhere.

Format with markdown-style headings (##, ###) and clear structure. Make it educational and engaging.
"""
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4000,
            }
        )
        
        lesson_text = response.text.strip()
        
        # Extract concepts mentioned in the lesson
        concepts = []
        concept_keywords = [
            "algorithm", "data structure", "pattern", "recursion", "iteration",
            "sorting", "searching", "dynamic programming", "greedy", "backtracking",
            "hash", "tree", "graph", "array", "list", "stack", "queue",
            "OOP", "inheritance", "polymorphism", "encapsulation", "abstraction",
            "function", "class", "method", "variable", "loop", "condition"
        ]
        
        lesson_lower = lesson_text.lower()
        for keyword in concept_keywords:
            if keyword in lesson_lower:
                concepts.append(keyword.title())
        
        # Remove duplicates
        concepts = list(set(concepts))
        
        return {
            "lesson": lesson_text,
            "concepts": concepts
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error generating lesson: {str(e)}")
        print(f"Traceback: {error_trace}")
        return {
            "lesson": f"Error generating lesson: {str(e)}. Please try again.",
            "concepts": []
        }


async def format_code(code: str, language: str) -> dict:
    """
    Format and beautify code according to language-specific style guidelines.
    """
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        display_name = display_names.get(language.lower(), language.capitalize())
        normalized_lang = language_map.get(language.lower(), language.lower())
        
        prompt = f"""You are a code formatter. Format the following {display_name} code according to the language's standard style guidelines and best practices.

Code to format:
```{normalized_lang}
{code}
```

Requirements:
1. **Indentation**: Use consistent indentation (4 spaces for Python, 2 spaces for JavaScript/TypeScript, etc.)
2. **Spacing**: Add proper spacing around operators, after commas, before/after braces
3. **Line breaks**: Break long lines appropriately (max 80-100 characters when possible)
4. **Brackets/Braces**: Use consistent bracket/brace style for the language
5. **Naming**: Keep existing names but ensure consistent style (camelCase, snake_case, etc.)
6. **Comments**: Preserve existing comments and their formatting
7. **Imports**: Organize imports if applicable (standard library, third-party, local)
8. **Blank lines**: Add appropriate blank lines between functions, classes, and logical sections

IMPORTANT:
- Return ONLY the formatted code, wrapped in a code block
- Do NOT add explanations or comments about the formatting
- Do NOT change the logic or functionality of the code
- Preserve all comments and docstrings exactly as they are
- If the code is already well-formatted, return it as-is

Format the code now:
"""
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.1,  # Low temperature for consistent formatting
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4000,
            }
        )
        
        formatted_text = response.text.strip()
        
        # Extract code from markdown code block if present
        code_block_pattern = rf'```{normalized_lang}?\s*\n(.*?)\n```'
        match = re.search(code_block_pattern, formatted_text, re.DOTALL)
        if match:
            formatted_code = match.group(1)
        else:
            # Try without language specifier
            code_block_pattern = r'```\s*\n(.*?)\n```'
            match = re.search(code_block_pattern, formatted_text, re.DOTALL)
            if match:
                formatted_code = match.group(1)
            else:
                # If no code block found, use the text as-is (might be plain code)
                formatted_code = formatted_text
        
        # Check if changes were made by comparing (normalize whitespace for comparison)
        original_normalized = '\n'.join(line.rstrip() for line in code.split('\n'))
        formatted_normalized = '\n'.join(line.rstrip() for line in formatted_code.split('\n'))
        changes_made = original_normalized != formatted_normalized
        
        return {
            "formatted_code": formatted_code,
            "changes_made": changes_made
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error formatting code: {str(e)}")
        print(f"Traceback: {error_trace}")
        return {
            "formatted_code": code,  # Return original code on error
            "changes_made": False
        }

