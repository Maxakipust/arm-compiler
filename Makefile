default: execute

output/output.s: src/index.ts src/ast.ts src/codeGenerator.ts src/parser.ts src/test.ts src/typeChecker.ts src/typeCheck.ts src/type.ts src/visitor.ts examples/example.idk
	ts-node src/index.ts examples/example.idk output/output.s

output/output: output/output.s
	gcc -g -march=armv8-a output/output.s -o output/output

execute: output/output
	./output/output
