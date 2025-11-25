import subprocess
import tempfile
import os
import time
import re
import shutil
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

# Language installation messages
LANGUAGE_INSTALL_MESSAGES = {
    'php': 'PHP is not installed. Install it with: brew install php (macOS) or apt-get install php (Linux)',
    'ruby': 'Ruby is not installed. Install it with: brew install ruby (macOS) or apt-get install ruby (Linux)',
    'java': 'Java is not installed. Install it with: brew install openjdk (macOS) or apt-get install default-jdk (Linux)',
    'go': 'Go is not installed. Install it from https://go.dev/dl/',
    'rust': 'Rust is not installed. Install it from https://rustup.rs/',
    'cpp': 'C++ compiler (g++) is not installed. Install it with: brew install gcc (macOS) or apt-get install build-essential (Linux)',
    'c': 'C compiler (gcc) is not installed. Install it with: brew install gcc (macOS) or apt-get install build-essential (Linux)',
    'csharp': 'Dotnet is not installed. Install it from https://dotnet.microsoft.com/download',
    'python': 'Python 3 is not installed. Install it from https://www.python.org/downloads/',
}


def check_command_exists(command: str) -> bool:
    """Check if a command exists in the system PATH or common Homebrew paths."""
    # First check standard PATH
    if shutil.which(command):
        return True
    
    # Check common Homebrew paths (macOS)
    homebrew_paths = [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        os.path.expanduser('~/.cargo/bin'),  # Rust/Cargo
    ]
    
    for path in homebrew_paths:
        full_path = os.path.join(path, command)
        if os.path.isfile(full_path) and os.access(full_path, os.X_OK):
            return True
    
    return False


def get_command_path(command: str) -> str:
    """Get the full path to a command, checking Homebrew paths if needed."""
    # First check standard PATH
    cmd_path = shutil.which(command)
    if cmd_path:
        return cmd_path
    
    # Check common Homebrew paths
    homebrew_paths = [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        os.path.expanduser('~/.cargo/bin'),  # Rust/Cargo
    ]
    
    for path in homebrew_paths:
        full_path = os.path.join(path, command)
        if os.path.isfile(full_path) and os.access(full_path, os.X_OK):
            return full_path
    
    return command  # Return original if not found


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
    
    # Check if required commands are available
    if language == 'php':
        if not check_command_exists('php'):
            return {
                'output': '',
                'error': f"PHP runtime not found. {LANGUAGE_INSTALL_MESSAGES.get('php', 'Please install PHP to run PHP code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language == 'ruby':
        if not check_command_exists('ruby'):
            return {
                'output': '',
                'error': f"Ruby runtime not found. {LANGUAGE_INSTALL_MESSAGES.get('ruby', 'Please install Ruby to run Ruby code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language == 'java':
        if not check_command_exists('java') or not check_command_exists('javac'):
            return {
                'output': '',
                'error': f"Java runtime not found. {LANGUAGE_INSTALL_MESSAGES.get('java', 'Please install Java JDK to run Java code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language == 'go':
        if not check_command_exists('go'):
            return {
                'output': '',
                'error': f"Go runtime not found. {LANGUAGE_INSTALL_MESSAGES.get('go', 'Please install Go to run Go code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language == 'rust':
        if not check_command_exists('rustc'):
            return {
                'output': '',
                'error': f"Rust compiler not found. {LANGUAGE_INSTALL_MESSAGES.get('rust', 'Please install Rust to run Rust code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language in ['cpp', 'c']:
        compiler = 'g++' if language == 'cpp' else 'gcc'
        if not check_command_exists(compiler):
            return {
                'output': '',
                'error': f"{compiler.upper()} compiler not found. {LANGUAGE_INSTALL_MESSAGES.get(language, 'Please install a C/C++ compiler.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language == 'csharp':
        if not check_command_exists('dotnet'):
            return {
                'output': '',
                'error': f"Dotnet runtime not found. {LANGUAGE_INSTALL_MESSAGES.get('csharp', 'Please install .NET SDK to run C# code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    elif language == 'python':
        if not check_command_exists('python3'):
            return {
                'output': '',
                'error': f"Python 3 not found. {LANGUAGE_INSTALL_MESSAGES.get('python', 'Please install Python 3 to run Python code.')}",
                'exit_code': 1,
                'execution_time': 0.0
            }
    
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
            
            # Prepare environment with extended PATH for Homebrew
            env = os.environ.copy()
            env['PYTHONUNBUFFERED'] = '1'
            # Add common Homebrew paths to PATH
            homebrew_paths = ['/opt/homebrew/bin', '/usr/local/bin', os.path.expanduser('~/.cargo/bin')]
            current_path = env.get('PATH', '')
            for path in homebrew_paths:
                if path not in current_path:
                    current_path = f"{path}:{current_path}" if current_path else path
            env['PATH'] = current_path
            
            # Handle compilation for compiled languages (but not C# or Rust, handled separately)
            if 'compile_command' in config and language not in ['csharp', 'rust', 'java']:
                compile_cmd = [part.format(
                    file=str(file_path),
                    executable=str(file_path.with_suffix(''))
                ) for part in config['compile_command']]
                
                # Resolve compiler path
                if compile_cmd:
                    compiler_path = get_command_path(compile_cmd[0])
                    compile_cmd[0] = compiler_path
                
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir,
                    env=env
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
                javac_path = get_command_path('javac')
                compile_cmd = [javac_path, str(file_path)]
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir,
                    env=env
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
                rustc_path = get_command_path('rustc')
                compile_cmd = [rustc_path, str(file_path), '-o', str(executable)]
                # Suppress rustup info messages
                rust_env = env.copy()
                rust_env['RUSTUP_TOOLCHAIN'] = 'stable'
                rust_env['RUSTUP_LOG'] = 'error'  # Only show errors, not info messages
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=temp_dir,
                    env=rust_env
                )
                # Filter out rustup info messages from stderr
                if compile_result.stderr:
                    stderr_lines = compile_result.stderr.split('\n')
                    # Remove rustup info lines and empty lines
                    filtered_stderr = [line for line in stderr_lines 
                                     if not (line.startswith('info:') or 
                                            line.startswith('warning:') or
                                            line.strip() == '')]
                    if filtered_stderr:
                        compile_result.stderr = '\n'.join(filtered_stderr)
                    else:
                        compile_result.stderr = ''
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
            
            # Resolve command paths (especially for Homebrew-installed tools)
            if exec_cmd:
                first_cmd = exec_cmd[0]
                # Get full path if it's a simple command name
                if '/' not in first_cmd and not first_cmd.startswith('.'):
                    resolved_path = get_command_path(first_cmd)
                    exec_cmd[0] = resolved_path
            
            # Execute code
            start_time = time.time()
            result = subprocess.run(
                exec_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=exec_cwd if 'exec_cwd' in locals() else temp_dir,
                env=env
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
        except FileNotFoundError as e:
            # Handle missing command/runtime
            error_msg = str(e)
            if 'No such file or directory' in error_msg or 'not found' in error_msg.lower():
                cmd_name = error_msg.split("'")[1] if "'" in error_msg else 'command'
                lang_msg = LANGUAGE_INSTALL_MESSAGES.get(language, f'Please install {cmd_name} to run {language} code.')
                return {
                    'output': '',
                    'error': f'{cmd_name.capitalize()} not found. {lang_msg}',
                    'exit_code': 1,
                    'execution_time': 0.0
                }
            return {
                'output': '',
                'error': f'Execution error: {str(e)}',
                'exit_code': 1,
                'execution_time': 0.0
            }
        except Exception as e:
            error_str = str(e)
            # Check if it's a missing command error
            if 'No such file or directory' in error_str or 'not found' in error_str.lower():
                cmd_name = error_str.split("'")[1] if "'" in error_str else language
                lang_msg = LANGUAGE_INSTALL_MESSAGES.get(language, f'Please install the required runtime for {language}.')
                return {
                    'output': '',
                    'error': f'Runtime not found: {cmd_name}. {lang_msg}',
                    'exit_code': 1,
                    'execution_time': 0.0
                }
            return {
                'output': '',
                'error': f'Execution error: {str(e)}',
                'exit_code': 1,
                'execution_time': 0.0
            }

