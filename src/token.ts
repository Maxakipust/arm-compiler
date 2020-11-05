class Token {
    constructor(public line: number, public col: number, public type: string, public value: string) {}
}

const keywords: Array<String> = [
    "function", "if", "else", "return", "var", "while", "for", "undefined", "null", "true", "false"
]

const types: Array<String> = [
    "Array", "void", "boolean", "number",
]

const operators = {
    ";" : "Semicolon",
    "," : "Comma",
    "(" : "Left_Paren",
    ")" : "Right_Paren",
    "{" : "Left_Brace",
    "}" : "Right_Brace",
    "[" : "Left_Bracket",
    "]" : "Right_Bracket",
    ":" : "Colon",
    "'" : "Apostrophe",
    "!" : "Bang",
    "==" : "Equal_Equal",
    "!=" : "Bank_Equal",
    "+" : "Plus",
    "-" : "Minus",
    "*" : "Star",
    "/" : "Slash",
    "=" : "Equal",
    ">=" : "Greater_Than_Equal",
    "<=" : "Less_Than_Equal", 
    ">" : "Greater_Than",
    "<" : "Less_Than",
}


export function tokenize(source: String){
    
}