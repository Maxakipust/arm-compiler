import fs, { write } from "fs"
import parser from './parser'
import { FunctionType, NumberType, Param, VoidType, ThreadType, ArrayType } from "./type";
import TypeChecker from './typeChecker'
import CodeGenerator from './codeGenerator'
let globalStart = new Date();

let filePath = process.argv[2];
let fileContents = fs.readFileSync(filePath, 'utf8');

let outputPath = process.argv[3];
let writeStream = fs.createWriteStream(outputPath);
let emit = (data:string)=> writeStream.write(data+"\n", 'utf8');

let start = new Date();
let ast = parser.parseStringToCompletion(fileContents);
let end = new Date();
console.log(`Parsing finished in ${end.getMilliseconds() - start.getMilliseconds()}ms`);

let globals = new Map<string, FunctionType>();
globals.set("putchar", new FunctionType([new Param("x0", new NumberType())], new VoidType()));
globals.set("waitpid", new FunctionType([new Param("x0", new ThreadType()), new Param("x1", new NumberType()), new Param("x2", new NumberType())], new VoidType()));
globals.set("sleep", new FunctionType([new Param("x0", new NumberType())], new VoidType()));
globals.set("printf", new FunctionType([new Param("x0", new ArrayType(new NumberType())), new Param("x1", new NumberType())], new VoidType()));

start = new Date();
//ast.visit(new TypeChecker(new Map(), globals, new VoidType()))
end = new Date();
console.log(`Type checking finished in ${end.getMilliseconds() - start.getMilliseconds()}ms`);

start = new Date();
ast.visit(new CodeGenerator(new Map(), 0, emit));
end = new Date();
console.log(`Code generation finished in ${end.getMilliseconds() - start.getMilliseconds()}ms`);

let globalFinished = new Date();
console.log(`In total it took ${globalFinished.getMilliseconds() - globalStart.getMilliseconds()}ms`);
