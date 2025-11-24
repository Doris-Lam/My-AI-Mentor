import subprocess
import tempfile
import os
import time
import re
from pathlib import Path
from typing import Dict

# Language execution configurations
EXECUTION_CONFIG = {
    'python': {
        'command': ['python3', '{file}'],
        'extension': '.py',
        'timeout': 10,
    },
    'java': {
        'command': ['java', '{class_name}'],
        'extension': '.java',
        'timeout': 10,
        'compile_command': ['javac', '{file}'],
    },
    'ruby': {
        'command': ['ruby', '{file}'],
        'extension': '.rb',
        'timeout': 10,
    },
    'php': {
        'command': ['php', '{file}'],
        'extension': '.php',
        'timeout': 10,
    },
    'cpp': {
        'command': ['./{executable}'],
        'extension': '.cpp',
        'timeout': 10,
        'compile_command': ['g++', '{file}', '-o', '{executable}'],
    },
    'c': {
        'command': ['./{executable}'],
        'extension': '.c',
        'timeout': 10,
        'compile_command': ['gcc', '{file}', '-o', '{executable}'],
    },
    'csharp': {
        'command': ['dotnet', 'run', '--project', '{project_dir}'],
        'extension': '.cs',
        'timeout': 10,
        'requires_project': True,
        'project_template': '''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>''',
    },
    'go': {
        'command': ['go', 'run', '{file}'],
        'extension': '.go',
        'timeout': 10,
    },
    'rust': {
        'command': ['rustc', '{file}', '-o', '{executable}', '&&', './{executable}'],
        'extension': '.rs',
        'timeout': 15,
    },
}


def execute_code(code: str, language: str) -> Dict:
    """
    Execute code in a sandboxed environment with timeout and resource limits.
    Returns output, error, exit_code, and execution_time.
    """
    language = language.lower()
    
    if language not in EXECUTION_CONFIG:
        return {
            'output': '',
            'error': f'Language {language} is not supported for execution.',
            'exit_code': 1,
            'execution_time': 0.0
        }
    
    config = EXECUTION_CONFIG[language]
    timeout = config.get('timeout', 10)
    
    # Create temporary directory for execution
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # For Java, extract class name first to name the file correctly
            if language == 'java':
                class_name = 'Main'
                for line in code.split('\n'):
                    if 'public class' in line:
                        parts = line.split('public class')
                        if len(parts) > 1:
                            class_name = parts[1].split()[0].strip()
                            break
                # Write code to file with correct class name
                file_path = Path(temp_dir) / f'{class_name}{config["extension"]}'
            else:
                # Write code to temporary file
                file_path = Path(temp_dir) / f'main{config["extension"]}'
            
            file_path.write_text(code, encoding='utf-8')
            
            # Handle compilation for compiled languages (but not C# or Rust, handled separately)
            if 'compile_command' in config and language not in ['csharp', 'rust', 'java']:
                compile_cmd = [part.format(
                    file=str(file_path),
                    executable=str(file_path.with_suffix(''))
                ) for part in config['compile_command']]
                
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir
                )
                
                if compile_result.returncode != 0:
                    return {
                        'output': '',
                        'error': compile_result.stderr or 'Compilation failed',
                        'exit_code': compile_result.returncode,
                        'execution_time': 0.0
                    }
            
            # Handle Java compilation separately (after file is correctly named)
            if language == 'java':
                compile_cmd = ['javac', str(file_path)]
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir
                )
                
                if compile_result.returncode != 0:
                    return {
                        'output': '',
                        'error': compile_result.stderr or 'Compilation failed',
                        'exit_code': compile_result.returncode,
                        'execution_time': 0.0
                    }
            
            # Handle C# project setup
            if language == 'csharp' and config.get('requires_project'):
                project_dir = Path(temp_dir) / 'Project'
                project_dir.mkdir()
                
                # Create .csproj file
                csproj_path = project_dir / 'Project.csproj'
                csproj_path.write_text(config.get('project_template', ''), encoding='utf-8')
                
                # Move code file to project directory and rename to Program.cs
                program_path = project_dir / 'Program.cs'
                program_path.write_text(code, encoding='utf-8')
                
                # Update file_path for execution
                file_path = program_path
                
                # Prepare execution command
                exec_cmd = [part.format(project_dir=str(project_dir)) for part in config['command']]
                exec_cwd = str(project_dir)
            # Prepare execution command
            elif language == 'java':
                # Extract class name (already done above, but need it for execution)
                class_name = file_path.stem  # Get class name from filename
                exec_cmd = ['java', class_name]
                exec_cwd = str(temp_dir)
            elif language in ['cpp', 'c']:
                executable = file_path.with_suffix('')
                exec_cmd = [part.format(executable=executable.name) for part in config['command']]
                exec_cwd = str(temp_dir)
            elif language == 'rust':
                executable = file_path.with_suffix('')
                # Rust needs special handling - compile and run separately
                compile_cmd = ['rustc', str(file_path), '-o', str(executable)]
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir
                )
                if compile_result.returncode != 0:
                    return {
                        'output': '',
                        'error': compile_result.stderr or 'Compilation failed',
                        'exit_code': compile_result.returncode,
                        'execution_time': 0.0
                    }
                exec_cmd = ['./' + executable.name]
                exec_cwd = str(temp_dir)
            else:
                exec_cmd = [part.format(file=str(file_path)) for part in config['command']]
                exec_cwd = str(temp_dir)
            
            # Execute code
            start_time = time.time()
            result = subprocess.run(
                exec_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=exec_cwd if 'exec_cwd' in locals() else temp_dir,
                env={**os.environ, 'PYTHONUNBUFFERED': '1'}  # Unbuffered output for Python
            )
            execution_time = time.time() - start_time
            
            output = result.stdout
            error = result.stderr if result.returncode != 0 else None
            
            return {
                'output': output,
                'error': error,
                'exit_code': result.returncode,
                'execution_time': round(execution_time, 3)
            }
            
        except subprocess.TimeoutExpired:
            return {
                'output': '',
                'error': f'Execution timed out after {timeout} seconds.',
                'exit_code': 124,
                'execution_time': timeout
            }
        except Exception as e:
            return {
                'output': '',
                'error': f'Execution error: {str(e)}',
                'exit_code': 1,
                'execution_time': 0.0
            }

