export const getStarterCode = (lang: string): string => {
  const starters: Record<string, string> = {
    'python': `class HelloWorld:
    def __init__(self):
        self.message = "Hello World"
    
    def greet(self):
        print(self.message)

# Create an instance and call the method
obj = HelloWorld()
obj.greet()`,
    'java': `public class HelloWorld {
    private String message;
    
    public HelloWorld() {
        this.message = "Hello World";
    }
    
    public void greet() {
        System.out.println(this.message);
    }
    
    public static void main(String[] args) {
        HelloWorld obj = new HelloWorld();
        obj.greet();
    }
}`,
    'cpp': `#include <iostream>
#include <string>

class HelloWorld {
private:
    std::string message;
    
public:
    HelloWorld() {
        message = "Hello World";
    }
    
    void greet() {
        std::cout << message << std::endl;
    }
};

int main() {
    HelloWorld obj;
    obj.greet();
    return 0;
}`,
    'javascript': `class HelloWorld {
    constructor() {
        this.message = "Hello World";
    }
    
    greet() {
        console.log(this.message);
    }
}

// Create an instance and call the method
const obj = new HelloWorld();
obj.greet();`,
    'typescript': `class HelloWorld {
    private message: string;
    
    constructor() {
        this.message = "Hello World";
    }
    
    greet(): void {
        console.log(this.message);
    }
}

// Create an instance and call the method
const obj = new HelloWorld();
obj.greet();`,
    'ruby': `class HelloWorld
    def initialize
        @message = "Hello World"
    end
    
    def greet
        puts @message
    end
end

# Create an instance and call the method
obj = HelloWorld.new
obj.greet`,
    'go': `package main

import "fmt"

type HelloWorld struct {
    message string
}

func NewHelloWorld() *HelloWorld {
    return &HelloWorld{message: "Hello World"}
}

func (h *HelloWorld) Greet() {
    fmt.Println(h.message)
}

func main() {
    obj := NewHelloWorld()
    obj.Greet()
}`,
    'rust': `struct HelloWorld {
    message: String,
}

impl HelloWorld {
    fn new() -> Self {
        HelloWorld {
            message: String::from("Hello World"),
        }
    }
    
    fn greet(&self) {
        println!("{}", self.message);
    }
}

fn main() {
    let obj = HelloWorld::new();
    obj.greet();
}`,
    'php': `<?php
class HelloWorld {
    private $message;
    
    public function __construct() {
        $this->message = "Hello World";
    }
    
    public function greet() {
        echo $this->message;
    }
}

// Create an instance and call the method
$obj = new HelloWorld();
$obj->greet();
?>`,
    'csharp': `using System;

class HelloWorld {
    private string message;
    
    public HelloWorld() {
        this.message = "Hello World";
    }
    
    public void Greet() {
        Console.WriteLine(this.message);
    }
    
    public static void Main(string[] args) {
        HelloWorld obj = new HelloWorld();
        obj.Greet();
    }
}`,
  };
  
  return starters[lang] || starters['python'];
};

export const getLanguageOptions = () => [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
];

