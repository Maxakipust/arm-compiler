default: execute

output/output.s: src/index.ts
	ts-node src/index.ts > output/output.s

output/output: output/output.s
	gcc -g -march=armv8-a output/output.s -o output/output

execute: output/output
	./output/output