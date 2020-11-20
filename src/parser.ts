import * as AST from "./ast";
import * as Type from "./type";

class Parser<T> {
    constructor(public parse: (source: Source) => (ParseResult<T> | null)) { }

    static regexp(regexp: RegExp): Parser<string> {
        return new Parser(source => {
            return source.match(regexp)
        });
    }

    static constant<U extends any | null>(value: U): Parser<U> {
        return new Parser(source => new ParseResult(value, source));
    }

    static error<U>(message: string): Parser<U> {
        return new Parser(source => {
            //better error handeling (line-col pair, context)
            throw Error(message);
        });
    }

    or(parser: Parser<T>): Parser<T> {
        return new Parser((source) => {
            let result = this.parse(source);
            return result ? result : parser.parse(source);
        })
    }

    static zeroOrMore<U>(parser: Parser<U>): Parser<Array<U>> {
        return new Parser(source => {
            let results = [];
            let item;
            while (item = parser.parse(source)) {
                source = item.source;
                results.push(item.value);
            }
            return new ParseResult(results, source);
        });
    }

    bind<U>(callback: (value: T) => Parser<U>): Parser<U> {
        return new Parser((source) => {
            let result = this.parse(source);
            if (result) {
                let { value, source } = result;
                return callback(value).parse(source);
            } else {
                return null;
            }
        })
    }

    and<U>(parser: Parser<U>): Parser<U> {
        return this.bind((_) => parser);
    }

    map<U>(callback: (t: T) => U): Parser<U> {
        return this.bind((value) => Parser.constant(callback(value)));
    }

    static maybe<U>(parser: Parser<U>): Parser<U | null> {
        return parser.or(Parser.constant(null));
    }

    parseStringToCompletion(string: string): T {
        let source = new Source(string, 0);
        let result = this.parse(source);
        if (!result) {
            throw Error("Parse error at index 0");
        }

        let index = result.source.index;
        if (index != result.source.string.length) {
            throw Error("Parse error at index " + index);
        }
        return result.value;
    }
}

class Source {
    constructor(public string: string, public index: number) { }

    match(regexp: RegExp): (ParseResult<string> | null) {
        console.assert(regexp.sticky);
        if(!regexp.sticky){
            console.log(regexp)
        }
        regexp.lastIndex = this.index;
        let match = this.string.match(regexp);
        if (match) {
            let val = match[0];
            let newIndex = this.index + val.length;
            let source = new Source(this.string, newIndex);
            return new ParseResult(val, source);
        }
        return null;
    }
}

class ParseResult<T> {
    constructor(public value: T, public source: Source) { }
}




let whitespace = Parser.regexp(/[ \n\r\t]+/y);
let comments = Parser.regexp(/[/][/].*/y).or(Parser.regexp(/[/][*].*[*][/]/sy));
let ignored = Parser.zeroOrMore(whitespace.or(comments));

let token = (pattern: RegExp) => Parser.regexp(pattern).bind((value) => ignored.and(Parser.constant(value)));

let FUNCTION = token(/function\b/y);
let IF = token(/if\b/y);
let ELSE = token(/else\b/y);
let RETURN = token(/return\b/y);
let VAR = token(/var\b/y);
let WHILE = token(/while\b/y);
let FOR = token(/for\b/y);
let THREAD = token(/thread\b/y);
let STRUCT = token(/struct\b/y);
let NEW = token(/new\b/y);

let ARRAY_TYPE = token(/Array\b/y);
let VOID_TYPE = token(/void\b/y).map((_)=> new Type.VoidType());
let BOOLEAN_TYPE = token(/boolean\b/y).map((_)=> new Type.BooleanType());
let NUMBER_TYPE = token(/number\b/y).map((_)=> new Type.NumberType());
let THREAD_TYPE = token(/Thread\b/y).map((_)=> new Type.ThreadType());

let COMMA = token(/[,]/y);
let SEMICOLON = token(/;/y);
let LEFT_PAREN = token(/[(]/y);
let RIGHT_PAREN = token(/[)]/y);
let LEFT_BRACE = token(/[{]/y);
let RIGHT_BRACE = token(/[}]/y);
let LEFT_BRACKET = token(/\[/y)
let RIGHT_BRACKET = token(/\]/y);
let COLON = token(/:/y);
let DOT = token(/[.]/y)


let UNDEFINED = token(/undefined\b/y).map((_) => new AST.Undefined())
let NULL = token(/null\b/y).map((_) => new AST.Null());


let TRUE = token(/true\b/y).map((_)=> new AST.Bool(true));
let FALSE = token(/false\b/y).map((_)=> new AST.Bool(false));
let boolean: Parser<AST.AST> = TRUE.or(FALSE);

let STRING = token(/".*"/y).map((string)=> new AST.Str(string.substring(1, string.length-1)))
let CHAR = token(/['].[']/y).map((chars) => new AST.Char(chars.charAt(1)));
let NUMBER = token(/[-]?[0-9]+/y).map((digits) => new AST.Num(parseInt(digits)));
let ID = token(/[a-zA-Z_][a-zA-Z0-9_]*/y);
let id = ID.map((x) => new AST.Id(x));

let NOT = token(/!/y).map((_) => AST.Not);
let EQUAL = token(/==/y).map((_) => AST.Equal);
let NOT_EQUAL = token(/!=/y).map((_) => AST.NotEqual);
let PLUS = token(/[+]/y).map((_) => AST.Add);
let MINUS = token(/[-]/y).map((_) => AST.Subtract);
let STAR = token(/[*]/y).map((_) => AST.Multiply);
let SLASH = token(/[/]/y).map((_) => AST.Divide);
let ASSIGN = token(/=/y).map((_)=> AST.Assign);
let GREATER_THAN = token(/>/y).map((_)=> AST.GreaterThan);
let LESS_THAN = token(/</y).map((_)=> AST.LessThan);
let GREATER_THAN_EQUAL = token(/>=/y).map((_)=> AST.GreaterThanEqual);
let LESS_THAN_EQUAL = token(/<=/y).map((_)=> AST.LessThanEqual);




//expressions
let expression: Parser<AST.AST> = Parser.error("expression parser used before definition");
// args <- (expression (COMMA expression)*)?
let args: Parser<Array<AST.AST>> =
    expression.bind((arg) =>
        Parser.zeroOrMore(COMMA.and(expression))
            .bind((args) =>
                Parser.constant([arg, ...args])
            )
    ).or(Parser.constant([]));
// call <- ID LEFT_PAREN args RIGHT_PAREN
let call: Parser<AST.AST> =
    ID.bind((callee) =>
        LEFT_PAREN.and(args.bind((args) =>
            RIGHT_PAREN.and(Parser.constant(
                callee === "length"
                ? new AST.Length(args[0])
                : new AST.Call(callee, args)
            ))
        ))
    );

let memberExpression: Parser<AST.AST> = expression.bind((object)=>
    DOT.and(ID.bind((property)=>
        Parser.constant(new AST.MemberExpression(object, property))
    )
))

let newExpression: Parser<AST.AST> = NEW.and((ID).bind((name)=>
    LEFT_PAREN.and((args).bind((args)=>
        Parser.constant(new AST.New(name, args))
    ))
))

//arrayLookup <-ID LEFT_BRACKET expression RIGHT_BRACKET
let arrayLookup: Parser<AST.AST> = 
    id.bind((array)=>
        LEFT_BRACKET.and(expression.bind((index)=>
            RIGHT_BRACKET.and(Parser.constant(
                new AST.ArrayLookup(array, index)
            ))
        ))
    );

let type: Parser<Type.Type> = Parser.error("type parser used before definition")
//arrayType <- ARRAY LESS_THAN type GREATER_THAN
let arrayType: Parser<Type.ArrayType> = ARRAY_TYPE.and(LESS_THAN).and(type).bind((type)=>
    GREATER_THAN.and(
        Parser.constant(new Type.ArrayType(type))
    )
);

let typeParser: Parser<Type.Type> = VOID_TYPE.or(BOOLEAN_TYPE).or(NUMBER_TYPE).or(THREAD_TYPE).or(arrayType).or(ID.bind((name)=> Parser.constant(new Type.StructType(name))));
//type <- VOID | BOOLEAN | NUMBER | THREAD_TYPE | arrayType
type.parse = typeParser.parse;

//arrayLiteral <-  LEFT_BRACKET RIGHT_BRACKET LEFT_BRACE args RIGHT_BRACE
let arrayLiteral: Parser<AST.AST> = 
    LEFT_BRACKET.and(RIGHT_BRACKET).and(LEFT_BRACE).and(args.bind((args)=>
        RIGHT_BRACE.and(Parser.constant(
            new AST.ArrayLiteral(args)
        ))
    ));

// emptyArray <- LEFT_BRACKET number type RIGHT_BRACKET
let emptyArray: Parser<AST.AST> = LEFT_BRACKET.and(expression.bind((size)=>
    type.bind((type)=>
        RIGHT_BRACKET.and(Parser.constant(
            new AST.EmptyArray(size, type)
        ))
    )
))

let blockStatement: Parser<AST.AST> = Parser.error("block parser used before definition");

//threadExpression <- THREAD LEFT_PAREN statement RIGHT_PAREN
let threadExpression: Parser<AST.AST>  = THREAD.and(
    blockStatement.bind((body)=>
        Parser.constant(new AST.Thread(body))
    )
)

//scalar <- boolean / NUMBER / CHAR / UNDEFINED / NULL / id
let scalar: Parser<AST.AST> = boolean.or(NUMBER).or(CHAR).or(STRING).or(UNDEFINED).or(NULL).or(id);

// atom <-call / arrayLiteral / arrayLookup / threadExpression / scalar / LEFT_PAREN expression RIGHT_PAREN
let atom: Parser<AST.AST> =
    call.or(arrayLiteral).or(emptyArray).or(arrayLookup).or(threadExpression).or(scalar).or(memberExpression).or(newExpression).or(LEFT_PAREN.and(expression).bind((e) =>
        RIGHT_PAREN.and(Parser.constant(e))
    ));

// unary <- NOT? atom
let unary: Parser<AST.AST> =
    Parser.maybe(NOT).bind((not) =>
        atom.map((term) => not ? new AST.Not(term) : term)
    );

let infix = (operatorParser: Parser<any>, termParser:Parser<any>)=>
    termParser.bind((term)=>
        Parser.zeroOrMore(operatorParser.bind((operator)=>
            termParser.bind((term)=>
                Parser.constant({operator, term})
            )
        )).map((operatorTerms)=>
            operatorTerms.reduce((left, {operator, term})=>
            new operator(left, term), term)
        )
    );

// product <- unary ((STAR / SLASH) unary)*
let product = infix(STAR.or(SLASH), unary);

// sum <- product ((PLUS / MINUS) product)*
let sum = infix(PLUS.or(MINUS), product);

// comparison <- sum ((EQUAL / NOT_EQUAL / GREATER_THAN_EQUAL / LESS_THAN_EQUAL / GREATER_THAN / LESS_THAN) sum)*
let comparison = infix(EQUAL.or(NOT_EQUAL).or(GREATER_THAN_EQUAL).or(LESS_THAN_EQUAL).or(GREATER_THAN).or(LESS_THAN), sum);

expression.parse = comparison.parse;

//statements
let statement: Parser<AST.AST> = Parser.error("statement parser used before definition");

// returnStatement <- RETURN expression SEMICOLON
let returnStatement: Parser<AST.AST> = RETURN.and(Parser.maybe(expression)).bind((term)=>
    SEMICOLON.and(Parser.constant(new AST.Return(term?term:new AST.Null())))
);

// expressionStatement <- expression SEMICOLON
let expressionStatement: Parser<AST.AST> = expression.bind((term)=> SEMICOLON.and(Parser.constant(term)));


// ifStatement <- IF LEFT_PAREN expression RIGHT_PAREN statement ELSE statement
let ifStatement: Parser<AST.AST> = IF.and(LEFT_PAREN).and(expression).bind((conditional)=>
    RIGHT_PAREN.and(statement).bind((consequence)=>
        ELSE.and(statement.bind((alternative)=>
            Parser.constant(new AST.If(conditional, consequence, alternative))
        )).or(Parser.constant(new AST.If(conditional, consequence, new AST.Block([]))))
    )
);

// whileStatement <- WHILE LEFT_PAREN expression RIGHT_PAREN statement
let whileStatement: Parser<AST.AST> = WHILE.and(LEFT_PAREN).and(expression).bind((conditional)=>
    RIGHT_PAREN.and(statement).bind((body)=>
        Parser.constant(new AST.While(conditional, body))
    )
);

// varStatement <- VAR ID ASSIGN expression SEMICOLON
let varStatement: Parser<AST.AST> = VAR.and(ID).bind((name)=>
    ASSIGN.and(expression).bind((value)=>
        SEMICOLON.and(Parser.constant(new AST.Var(name, value)))
    )
);

// assignmentStatement <- ID ASSIGN EXPRESSION SEMICOLON
let assignmentStatement: Parser<AST.AST> = ID.bind((name)=>
    ASSIGN.and(expression).bind((value)=>
        SEMICOLON.and(Parser.constant(new AST.Assign(name, value)))
    )
)

let arrayAssignment: Parser<AST.AST> = id.bind((array)=>
LEFT_BRACKET.and(expression.bind((index)=>
    RIGHT_BRACKET.and(ASSIGN).and(expression).bind((value)=>
        SEMICOLON.and(Parser.constant(new AST.ArrayAssignment(array, index, value)))
    )
))
)

// blockStatement <- LEFT_BRACE statement* RIGHT_BRACE
let block: Parser<AST.AST> = LEFT_BRACE.and(Parser.zeroOrMore(statement)).bind((statements)=>
    RIGHT_BRACE.and(Parser.constant(new AST.Block(statements)))
);

blockStatement.parse = block.parse;


// optionalTypeAnnotation <- (COLON type)?
let optionalTypeAnnotation: Parser<Type.Type> = Parser.maybe(COLON.and(type));

// parameter <- ID optionalTypeAnnotation
let parameter: Parser<Type.Param> = ID.bind((paramName)=>
    optionalTypeAnnotation.bind((paramType)=>
        Parser.constant(new Type.Param(paramName, paramType))
    )
);

//parameters <- (parameter (COMMA parameter)*)?
let parameters: Parser<Array<Type.Param>> = parameter.bind((param)=>
    Parser.zeroOrMore(COMMA.and(parameter)).bind((params)=>
        Parser.constant([param, ...params])
    )
).or(Parser.constant([]))

// functionStatement <- FUNCTION ID LEFT_PAREN parameters RIGHT_PAREN optionalTypeAnnotation blockStatement
let functionStatement: Parser<AST.AST> = FUNCTION.and(ID).bind((name)=>
    LEFT_PAREN.and(parameters).bind((parameters)=>
        RIGHT_PAREN.and(optionalTypeAnnotation).bind((returnType)=>
            blockStatement.bind((block)=>{
                return Parser.constant(
                    new AST.Func(name, new Type.FunctionType(parameters, returnType) ,block)
                )
            })
        )
    )
)

let structItem: Parser<Type.StructEntry> = ID.bind((paramName)=>
    COLON.and(type.bind((type)=>
            Parser.constant(new Type.StructEntry(paramName, type))
    ))
)

let structItems: Parser<Array<Type.StructEntry>> = structItem.bind((sItem)=>
    Parser.zeroOrMore(COMMA.and(structItem)).bind((sItems)=>
        Parser.constant([sItem, ...sItems])
    )
);

export let structStatement: Parser<AST.AST> = STRUCT.and(ID.bind((structName)=>
    LEFT_BRACE.and((structItems).bind((items)=>
            RIGHT_BRACE.and(Parser.constant(new AST.Struct(structName, items)))
    ))
));

// statement <- returnStatement
//            / ifStatement
//            / whileStatement
//            / varStatement
//            / assignmentStatement
//            / blockStatement
//            / functionStatement
//            / expressionStatement
//            / forStatement

let statementParser: Parser<AST.AST> = structStatement
    .or(returnStatement)
    .or(functionStatement)
    .or(ifStatement)
    .or(whileStatement)
    .or(varStatement)
    .or(assignmentStatement)
    .or(arrayAssignment)
    .or(blockStatement)
    .or(expressionStatement);
statement.parse = statementParser.parse;

let parser: Parser<AST.Block> =
    ignored.and(Parser.zeroOrMore(functionStatement.or(structStatement))).map((statements)=>
        new AST.Block(statements)
    );
export default parser;
