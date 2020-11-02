import Visitor from './visitor'
import * as AST from './ast'

export default class CodeGenerator implements Visitor<void> {
    constructor(public locals: Map<String, number> = new Map(), public nextLocalOffset: number = 0, public emit: (data: string)=>void ) {}

    visitNum(node: AST.Num){
        this.emit(`    ldr r0, =${node.value}`);
    }

    visitChar(node: AST.Char){
        this.emit(`    ldr r0, =${node.value.charCodeAt(0)}`)
    }
    visitId(node: AST.Id){
        let offset = this.locals.get(node.value);
        if(offset){
            this.emit(`    ldr r0, [fp, #${offset}]`);
        }else{
            throw Error(`Undefined variable ${node.value}`);
        }
    }
    visitNot(node: AST.Not){
            node.term.visit(this);
            this.emit(`    cmp r0, #0`);
            this.emit(`    moveq r0, #1`);
            this.emit(`    movne r0, #0`);
        
    }
    visitGreaterThan(node: AST.GreaterThanEqual){
        node.left.visit(this);
        this.emit(`    push {r0, ip}`);
        node.right.visit(this);
        this.emit(`    pop {r1, ip}`);
        this.emit(`    cmp r1, r0`);
        this.emit(`    movgt r0, #1`);
        this.emit(`    movle r0, #0`);
    }
    visitLessThan(node: AST.LessThan){
        node.left.visit(this);
        this.emit(`    push {r0, ip}`);
        node.right.visit(this);
        this.emit(`    pop {r1, ip}`);
        this.emit(`    cmp r1, r0`);
        this.emit(`    movls r0, #1`);
        this.emit(`    movge r0, #0`);
    }
    visitGreaterThanEqual(node: AST.GreaterThan){
        node.left.visit(this);
        this.emit(`    push {r0, ip}`);
        node.right.visit(this);
        this.emit(`    pop {r1, ip}`);
        this.emit(`    cmp r1, r0`);
        this.emit(`    movge r0, #1`);
        this.emit(`    movlt r0, #0`);
    }
    visitLessThanEqual(node: AST.LessThanEqual){
        node.left.visit(this);
        this.emit(`    push {r0, ip}`);
        node.right.visit(this);
        this.emit(`    pop {r1, ip}`);
        this.emit(`    cmp r1, r0`);
        this.emit(`    movle r0, #1`);
        this.emit(`    movgt r0, #0`);
    }
    visitEqual(node:AST.Equal){
            node.left.visit(this);
            this.emit(`    push {r0, ip}`);
            node.right.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    cmp r1, r0`);
            this.emit(`    moveq r0, #1`);
            this.emit(`    movne r0, #0`);
    }
    visitNotEqual(node: AST.NotEqual){
            node.left.visit(this);
            this.emit(`    push {r0, ip}`);
            node.right.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    cmp r1, r0`);
            this.emit(`    moveq r0, #0`);
            this.emit(`    movne r0, #1`);
        
    }
    visitAdd(node:AST.Add){
            node.left.visit(this);
            this.emit(`    push {r0, ip}`);
            node.right.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    add r0, r1, r0`);
        
    
    }
    visitSubtract(node:AST.Subtract){
            node.left.visit(this);
            this.emit(`    push {r0, ip}`);
            node.right.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    sub r0, r1, r0`);
        
    }
    visitMultiply(node:AST.Multiply){
            node.left.visit(this);
            this.emit(`    push {r0, ip}`);
            node.right.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    mul r0, r1, r0`);
    }
    visitDivide(node:AST.Divide){
            node.left.visit(this);
            this.emit(`    push {r0, ip}`);
            node.right.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    udiv r0, r1, r0`);
        
    }
    visitCall(node:AST.Call){
            let count = node.args.length;
            if(count === 0){
                this.emit(`    bl ${node.callee}`);
            }else if(count === 1) {
                node.args[0].visit(this);
                this.emit(`    bl ${node.callee}`);
            }else if(count >= 2 && count <= 4){
                this.emit(`    sub sp, sp, #16`);
                node.args.forEach((arg, i) => {
                    arg.visit(this);
                    this.emit(`    str r0, [sp, #${4*i}]`);
                });
                this.emit(`    pop {r0, r1, r2, r3}`);
                this.emit(`    bl ${node.callee}`);
            }else{
                throw Error("More than 4 arguments are not supported");
            }
        
    }
    visitReturn(node:AST.Return){
            node.term.visit(this);
            this.emit(`    mov sp, fp`);
            this.emit(`    pop {fp, pc}`);
        
    }
    visitBlock(node:AST.Block){
            node.statements.forEach((statement)=>
                statement.visit(this)
            );
        
    }
    visitIf(node:AST.If){
            let ifFalseLabel = new Label();
            let endIfLabel = new Label();
            node.conditional.visit(this);
            this.emit(`    cmp r0, #0`);
            this.emit(`    beq ${ifFalseLabel}`);
            node.consequence.visit(this);
            this.emit(`    b ${endIfLabel}`);
            this.emit(`${ifFalseLabel}:`);
            node.alternative.visit(this);
            this.emit(`${endIfLabel}:`);
        
    
    }
    visitFunc(node:AST.Func){
            if(node.signature.parameters.length > 4){
                throw Error("More than 4 params is not supported");
            }
            this.emit(``);
            this.emit(`.global ${node.name}`);
            this.emit(`${node.name}:`);
            this.emitPrologue();
            let visitor = this.setUpEnvironment(node);
            node.body.visit(visitor);
            this.emitEpilogue();
    }

    setUpEnvironment(node: AST.Func){
        let locals = new Map();
        node.signature.parameters.forEach((parameter, i) => {
            locals.set(parameter.name, 4 * i - 16);
        });
        return new CodeGenerator(locals, -20, this.emit);
    }

    emitPrologue(){
        this.emit(`    push {fp, lr}`);
        this.emit(`    mov fp, sp`);
        this.emit(`    push {r0, r1, r2, r3}`);
    }

    emitEpilogue(){
        this.emit(`    mov sp, fp`);
        this.emit(`    mov r0, #0`);
        this.emit(`    pop {fp, pc}`);
    }

    visitVar(node:AST.Var){
            node.value.visit(this);
            this.emit(`    push {r0, ip}`);
            this.locals.set(node.name, this.nextLocalOffset -4);
            this.nextLocalOffset -= 8;
        
    }
    visitAssign(node:AST.Assign){
            node.value.visit(this);
            let offset = this.locals.get(node.name);
            if(offset){
                this.emit(`    str r0, [fp, #${offset}]`);
            }else{
                throw Error(`Undefined variable: ${node.name}`);
            }
        
    }
    visitWhile(node:AST.While){
            let loopStart = new Label();
            let loopEnd = new Label();
    
            this.emit(`${loopStart}:`);
            node.conditional.visit(this);
            this.emit(`    cmp r0, #0`);
            this.emit(`    beq ${loopEnd}`);
            node.body.visit(this);
            this.emit(`    b ${loopStart}`);
            this.emit(`${loopEnd}:`);
        
    }
    visitBoolean(node:AST.Bool){
            if(node.value) {
                this.emit(`    mov r0, #1`);
            }else{
                this.emit(`    mov r0, #0`);
            }
    }
    visitUndefined(node:AST.Undefined){
            this.emit(`    mov r0, #0`);
        
    }
    visitNull(node:AST.Null){
            this.emit(`    mov r0, #0`);
        
    }
    visitArrayLiteral(node: AST.ArrayLiteral){
            let length = node.elements.length;
            this.emit(`    ldr r0, =${4 * (length + 1)}`);
            this.emit(`    bl malloc`);
            this.emit(`    push {r4, ip}`);
            this.emit(`    mov r4, r0`);
            this.emit(`    ldr r0, =${length}`);
            this.emit(`    str r0, [r4]`);
            node.elements.forEach((element, i ) => {
                element.visit(this);
                this.emit(`    str r0, [r4, #${4 * (i + 1)}]`);
            });
            this.emit(`    mov r0, r4`);
            this.emit(`    pop {r4, ip}`);
        
    }
    visitArrayLookup(node: AST.ArrayLookup){
            node.array.visit(this);
            this.emit(`    push {r0, ip}`);
            node.index.visit(this);
            this.emit(`    pop {r1, ip}`);
            this.emit(`    ldr r2, [r1]`);
            this.emit(`    cmp r0, r2`);
            this.emit(`    movhs r0, #0`);
            this.emit(`    addlo r1, r1, #4`);
            this.emit(`    lsllo r0, r0, #2`);
            this.emit(`    ldrlo r0, [r1, r0]`);
        
    }
    visitLength(node: AST.Length){
            node.array.visit(this);
            this.emit(`    ldr r0, [r0, #0]`);
        
    }
}

class Label {
    static counter = 0;
    value: number;

    constructor() {
        this.value = Label.counter++;
    }

    toString() {
        return `.L${this.value}`;
    }
}