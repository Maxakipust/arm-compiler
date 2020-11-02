# COMPILER!!!
This is my first attempt at an arm base compiler.
### Inspiration
It is pretty heavily based on the compiler from [this](https://keleshev.com/compiling-to-assembly-from-scratch/) although I did make modifications and additions.
### Running
It will output the assembly to stdout so in order to run everything use the following (or use the make file):
```
ts-node src/index.ts > output/output.s
gcc -g -march=armv8-a output/output.s -o output/output
./output/output
```
The `-march=armv8-a` is required to run on raspberry pis

### Grammar
The grammar for the language is as follows:
```
args <- (expression (COMMA expression)*)?
call <- ID LEFT_PAREN args RIGHT_PAREN
arrayLiteral <- LEFT_BRACKET args RIGHT_BRACKET
arrayLookup <-ID LEFT_BRACKET expression RIGHT_BRACKET
arrayType <- ARRAY LESS_THAN type GREATER_THAN
type <- VOID | BOOLEAN | NUMBER | arrayType
scalar <- boolean / NUMBER / CHAR / UNDEFINED / NULL / id
atom <-call / arrayLiteral / arrayLookup / scalar / LEFT_PAREN expression RIGHT_PAREN
unary <- NOT? atom
product <- unary ((STAR / SLASH) unary)*
sum <- product ((PLUS / MINUS) product)*
comparison <- sum ((EQUAL / NOT_EQUAL / GREATER_THAN_EQUAL / LESS_THAN_EQUAL / GREATER_THAN / LESS_THAN) sum)*
returnStatement <- RETURN expression SEMICOLON
expressionStatement <- expression SEMICOLON
ifStatement <- IF LEFT_PAREN expression RIGHT_PAREN statement ELSE statement
whileStatement <- WHILE LEFT_PAREN expression RIGHT_PAREN statement
varStatement <- VAR ID ASSIGN expression SEMICOLON
assignmentStatement <- ID ASSIGN EXPRESSION SEMICOLON
blockStatement <- LEFT_BRACE statement* RIGHT_BRACE
optionalTypeAnnotation <- (COLON type)?
parameter <- ID optionalTypeAnnotation
parameters <- (parameter (COMMA parameter)*)?
functionStatement <- FUNCTION ID LEFT_PAREN parameters RIGHT_PAREN optionalTypeAnnotation blockStatement
statement <- returnStatement / ifStatement / whileStatement / varStatement / assignmentStatement / blockStatement / functionStatement / expressionStatement
```