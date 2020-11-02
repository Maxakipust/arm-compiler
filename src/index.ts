import fs, { write } from "fs"

interface AST {
    visit<T>(v: Visitor<T>): T;
    equals(other: AST): boolean;
}

interface Visitor<T> {
    visitNum(node: Num): T;
    visitChar(node:Char): T;
    visitId(node:Id): T;
    visitNot(node:Not): T;
    visitGreaterThan(node: GreaterThan): T;
    visitLessThan(node: LessThan): T;
    visitGreaterThanEqual(node: GreaterThanEqual): T;
    visitLessThanEqual(node: LessThanEqual): T;
    visitEqual(node:Equal): T;
    visitNotEqual(node: NotEqual): T;
    visitAdd(node:Add): T;
    visitSubtract(node:Subtract): T;
    visitMultiply(node:Multiply): T;
    visitDivide(node:Divide): T;
    visitCall(node:Call): T;
    visitReturn(node:Return): T;
    visitBlock(node:Block): T;
    visitIf(node:If): T;
    visitFunc(node:Func): T;
    visitVar(node:Var): T;
    visitAssign(node:Assign): T;
    visitWhile(node:While): T;
    visitBoolean(node:Boolean): T;
    visitUndefined(node:Undefined): T;
    visitNull(node:Null): T;
    visitArrayLiteral(node: ArrayLiteral): T;
    visitArrayLookup(node: ArrayLookup): T;
    visitLength(node: Length): T;
}

class CodeGenerator implements Visitor<void> {
    constructor(public locals: Map<String, number> = new Map(), public nextLocalOffset: number = 0) {}

    visitNum(node: Num){
        emit(`    ldr r0, =${node.value}`);
    }

    visitChar(node:Char){
        emit(`    ldr r0, =${node.value.charCodeAt(0)}`)
    }
    visitId(node:Id){
        let offset = this.locals.get(node.value);
        if(offset){
            emit(`    ldr r0, [fp, #${offset}]`);
        }else{
            throw Error(`Undefined variable ${node.value}`);
        }
    }
    visitNot(node:Not){
            node.term.visit(this);
            emit(`    cmp r0, #0`);
            emit(`    moveq r0, #1`);
            emit(`    movne r0, #0`);
        
    }
    visitGreaterThan(node: GreaterThanEqual){
        node.left.visit(this);
        emit(`    push {r0, ip}`);
        node.right.visit(this);
        emit(`    pop {r1, ip}`);
        emit(`    cmp r1, r0`);
        emit(`    movgt r0, #1`);
        emit(`    movle r0, #0`);
    }
    visitLessThan(node: LessThan){
        node.left.visit(this);
        emit(`    push {r0, ip}`);
        node.right.visit(this);
        emit(`    pop {r1, ip}`);
        emit(`    cmp r1, r0`);
        emit(`    movls r0, #1`);
        emit(`    movge r0, #0`);
    }
    visitGreaterThanEqual(node: GreaterThan){
        node.left.visit(this);
        emit(`    push {r0, ip}`);
        node.right.visit(this);
        emit(`    pop {r1, ip}`);
        emit(`    cmp r1, r0`);
        emit(`    movge r0, #1`);
        emit(`    movlt r0, #0`);
    }
    visitLessThanEqual(node: LessThanEqual){
        node.left.visit(this);
        emit(`    push {r0, ip}`);
        node.right.visit(this);
        emit(`    pop {r1, ip}`);
        emit(`    cmp r1, r0`);
        emit(`    movle r0, #1`);
        emit(`    movgt r0, #0`);
    }
    visitEqual(node:Equal){
            node.left.visit(this);
            emit(`    push {r0, ip}`);
            node.right.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    cmp r1, r0`);
            emit(`    moveq r0, #1`);
            emit(`    movne r0, #0`);
    }
    visitNotEqual(node: NotEqual){
            node.left.visit(this);
            emit(`    push {r0, ip}`);
            node.right.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    cmp r1, r0`);
            emit(`    moveq r0, #0`);
            emit(`    movne r0, #1`);
        
    }
    visitAdd(node:Add){
            node.left.visit(this);
            emit(`    push {r0, ip}`);
            node.right.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    add r0, r1, r0`);
        
    
    }
    visitSubtract(node:Subtract){
            node.left.visit(this);
            emit(`    push {r0, ip}`);
            node.right.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    sub r0, r1, r0`);
        
    }
    visitMultiply(node:Multiply){
            node.left.visit(this);
            emit(`    push {r0, ip}`);
            node.right.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    mul r0, r1, r0`);
    }
    visitDivide(node:Divide){
            node.left.visit(this);
            emit(`    push {r0, ip}`);
            node.right.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    udiv r0, r1, r0`);
        
    }
    visitCall(node:Call){
            let count = node.args.length;
            if(count === 0){
                emit(`    bl ${node.callee}`);
            }else if(count === 1) {
                node.args[0].visit(this);
                emit(`    bl ${node.callee}`);
            }else if(count >= 2 && count <= 4){
                emit(`    sub sp, sp, #16`);
                node.args.forEach((arg, i) => {
                    arg.visit(this);
                    emit(`    str r0, [sp, #${4*i}]`);
                });
                emit(`    pop {r0, r1, r2, r3}`);
                emit(`    bl ${node.callee}`);
            }else{
                throw Error("More than 4 arguments are not supported");
            }
        
    }
    visitReturn(node:Return){
            node.term.visit(this);
            emit(`    mov sp, fp`);
            emit(`    pop {fp, pc}`);
        
    }
    visitBlock(node:Block){
            node.statements.forEach((statement)=>
                statement.visit(this)
            );
        
    }
    visitIf(node:If){
            let ifFalseLabel = new Label();
            let endIfLabel = new Label();
            node.conditional.visit(this);
            emit(`    cmp r0, #0`);
            emit(`    beq ${ifFalseLabel}`);
            node.consequence.visit(this);
            emit(`    b ${endIfLabel}`);
            emit(`${ifFalseLabel}:`);
            node.alternative.visit(this);
            emit(`${endIfLabel}:`);
        
    
    }
    visitFunc(node:Func){
            if(node.signature.parameters.length > 4){
                throw Error("More than 4 params is not supported");
            }
            emit(``);
            emit(`.global ${node.name}`);
            emit(`${node.name}:`);
            this.emitPrologue();
            let visitor = this.setUpEnvironment(node);
            node.body.visit(visitor);
            this.emitEpilogue();
    }

    setUpEnvironment(node: Func){
        let locals = new Map();
        node.signature.parameters.forEach((parameter, i) => {
            locals.set(parameter.name, 4 * i - 16);
        });
        return new CodeGenerator(locals, -20);
    }

    emitPrologue(){
        emit(`    push {fp, lr}`);
        emit(`    mov fp, sp`);
        emit(`    push {r0, r1, r2, r3}`);
    }

    emitEpilogue(){
        emit(`    mov sp, fp`);
        emit(`    mov r0, #0`);
        emit(`    pop {fp, pc}`);
    }

    visitVar(node:Var){
            node.value.visit(this);
            emit(`    push {r0, ip}`);
            this.locals.set(node.name, this.nextLocalOffset -4);
            this.nextLocalOffset -= 8;
        
    }
    visitAssign(node:Assign){
            node.value.visit(this);
            let offset = this.locals.get(node.name);
            if(offset){
                emit(`    str r0, [fp, #${offset}]`);
            }else{
                throw Error(`Undefined variable: ${node.name}`);
            }
        
    }
    visitWhile(node:While){
            let loopStart = new Label();
            let loopEnd = new Label();
    
            emit(`${loopStart}:`);
            node.conditional.visit(this);
            emit(`    cmp r0, #0`);
            emit(`    beq ${loopEnd}`);
            node.body.visit(this);
            emit(`    b ${loopStart}`);
            emit(`${loopEnd}:`);
        
    }
    visitBoolean(node:Boolean){
            if(node.value) {
                emit(`    mov r0, #1`);
            }else{
                emit(`    mov r0, #0`);
            }
    }
    visitUndefined(node:Undefined){
            emit(`    mov r0, #0`);
        
    }
    visitNull(node:Null){
            emit(`    mov r0, #0`);
        
    }
    visitArrayLiteral(node: ArrayLiteral){
            let length = node.elements.length;
            emit(`    ldr r0, =${4 * (length + 1)}`);
            emit(`    bl malloc`);
            emit(`    push {r4, ip}`);
            emit(`    mov r4, r0`);
            emit(`    ldr r0, =${length}`);
            emit(`    str r0, [r4]`);
            node.elements.forEach((element, i ) => {
                element.visit(this);
                emit(`    str r0, [r4, #${4 * (i + 1)}]`);
            });
            emit(`    mov r0, r4`);
            emit(`    pop {r4, ip}`);
        
    }
    visitArrayLookup(node: ArrayLookup){
            node.array.visit(this);
            emit(`    push {r0, ip}`);
            node.index.visit(this);
            emit(`    pop {r1, ip}`);
            emit(`    ldr r2, [r1]`);
            emit(`    cmp r0, r2`);
            emit(`    movhs r0, #0`);
            emit(`    addlo r1, r1, #4`);
            emit(`    lsllo r0, r0, #2`);
            emit(`    ldrlo r0, [r1, r0]`);
        
    }
    visitLength(node: Length){
            node.array.visit(this);
            emit(`    ldr r0, [r0, #0]`);
        
    }
}

interface Type {
    equals(other: Type): boolean;
    toString(): string;
}

class BooleanType implements Type {
    constructor() {}
    
    equals(other: Type): boolean {
        return other instanceof BooleanType;
    }
    toString(): string {
        return "boolean";
    }

}

class NumberType implements Type {
    constructor() {}
    
    equals(other: Type): boolean {
        return other instanceof NumberType;
    }
    toString(): string {
        return "number"
    }
}

class VoidType implements Type {
    constructor() {}
    
    equals(other: Type): boolean {
        return other instanceof VoidType;
    }
    toString(): string {
        return "void";
    }
}

class ArrayType implements Type {
    constructor(public element: Type) {}
    equals(other: Type): boolean {
        return other instanceof ArrayType &&
            this.element.equals(other.element);
    }
    toString(): string {
        return `Array<${this.element}>`
    }
}

class Param {
    constructor(public name: string, public type: Type) {}
    toString(){
        return `${this.name}: ${this.type}`;
    }
}

class FunctionType implements Type {
    constructor(
        public parameters: Array<Param>,
        public returnType: Type
    ) {}
    equals(other: Type): boolean {
        if(!(other instanceof FunctionType) || (this.parameters.length != other.parameters.length) || (!this.returnType.equals(other.returnType))){
            return false;
        }
        
        return this.parameters.every((param:Param, index:number)=>param.type.equals(other.parameters[index].type));
    }
    toString(): string {
        return `(${this.parameters.map((param)=>param.toString()).join(', ')}) => ${this.returnType}`
    }
}

class Num implements AST {
    constructor(public value: number) { }

    visit<T>(v:Visitor<T>){
        return v.visitNum(this);
    }
    
    equals(other: AST): boolean {
        return (other instanceof Num && this.value === other.value);
    }
}

class Char implements AST {
    constructor(public value: string) {}
    visit<T>(v: Visitor<T>): T {
       return v.visitChar(this);
    }

    equals(other: AST): boolean {
        return other instanceof Char &&
            this.value === other.value;
    }

}

class Id implements AST {
    constructor(public value: string) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitId(this);
    }


    equals(other: AST): boolean {
        return (other instanceof Id && this.value === other.value);
    }
}

class Not implements AST {
    constructor(public term: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitNot(this);
    }

    equals(other: AST): boolean {
        return (other instanceof Not && this.term.equals(other.term));
    }
}

class GreaterThan implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitGreaterThan(this);
    }

    equals(other: AST): boolean {
        if (other instanceof GreaterThan) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class LessThan implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitLessThan(this);
    }

    equals(other: AST): boolean {
        if (other instanceof LessThan) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class GreaterThanEqual implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitGreaterThanEqual(this);
    }

    equals(other: AST): boolean {
        if (other instanceof GreaterThanEqual) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class LessThanEqual implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitLessThanEqual(this);
    }

    equals(other: AST): boolean {
        if (other instanceof LessThanEqual) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class Equal implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitEqual(this);
    }

    equals(other: AST): boolean {
        if (other instanceof Equal) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class NotEqual implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitNotEqual(this);
    }

    equals(other: AST): boolean {
        if (other instanceof NotEqual) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class Add implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitAdd(this);
    }

    equals(other: AST): boolean {
        if (other instanceof Add) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class Subtract implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitSubtract(this);
    }

    equals(other: AST): boolean {
        if (other instanceof Subtract) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class Multiply implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitMultiply(this);
    }


    equals(other: AST): boolean {
        if (other instanceof Multiply) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class Divide implements AST {
    constructor(public left: AST, public right: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitDivide(this);
    }


    equals(other: AST): boolean {
        if (other instanceof Divide) {
            return (this.left.equals(other.left) && this.right.equals(other.right));
        }
        return false;
    }
}

class Call implements AST {
    constructor(public callee: string, public args: Array<AST>) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitCall(this);
    }

    equals(other: AST): boolean {
        return other instanceof Call &&
            this.callee === other.callee &&
            this.args.length === other.args.length &&
            this.args.every((arg, i) =>
                arg.equals(other.args[i])
            );
    }
}

class Return implements AST {
    constructor(public term: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitReturn(this);
    }

    equals(other: AST): boolean {
        return other instanceof Return &&
            this.term.equals(other.term);
    }
}

class Block implements AST {
    constructor(public statements: Array<AST>) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitBlock(this);
    }


    equals(other: AST): boolean {
        return other instanceof Block &&
            this.statements.every((statement, i) =>
                statement.equals(other.statements[i])
            );
    }
}

class If implements AST {
    constructor(public conditional: AST, public consequence: AST, public alternative: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitIf(this);
    }

    equals(other: AST): boolean {
        return other instanceof If &&
            this.conditional.equals(other.conditional) &&
            this.consequence.equals(other.consequence) &&
            this.alternative.equals(other.alternative);
    }
}

class Func implements AST {
    constructor(public name: string, public signature: FunctionType, public body: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitFunc(this);
    }

    equals(other: AST): boolean {
        return other instanceof Func &&
            this.name === other.name &&
            this.signature.equals(other.signature) &&
            this.body.equals(other.body);
    }
}

class Var implements AST {
    constructor(public name: string, public value: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitVar(this);
    }


    equals(other: AST): boolean {
        return other instanceof Var &&
            this.name === other.name &&
            this.value.equals(other.value);
    }
}

class Assign implements AST {
    constructor(public name: string, public value: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitAssign(this);
    }

    equals(other: AST): boolean {
        return other instanceof Assign &&
            this.name === other.name &&
            this.value.equals(other.value);
    }
}

class While implements AST {
    constructor(public conditional: AST, public body: AST) { }
    visit<T>(v: Visitor<T>): T {
        return v.visitWhile(this);
    }

    equals(other: AST): boolean {
        return other instanceof While &&
            this.conditional.equals(other.conditional) &&
            this.body.equals(other.body);
    }
}

class Boolean implements AST {
    constructor(public value: boolean) {}
    visit<T>(v: Visitor<T>): T {
        return v.visitBoolean(this);
    }

    equals(other:AST):boolean {
        return other instanceof Boolean &&
            other.value === this.value;
    }
}

class Undefined implements AST {
    constructor() {}
    visit<T>(v: Visitor<T>): T {
        return v.visitUndefined(this);
    }

    equals(other:AST):boolean {
        return other instanceof Undefined;
    }
}

class Null implements AST {
    constructor() {}
    visit<T>(v: Visitor<T>): T {
        return v.visitNull(this);
    }

    equals(other:AST):boolean {
        return other instanceof Null;
    }
}

class ArrayLiteral implements AST {
    constructor(public elements: Array<AST>) {}
    visit<T>(v: Visitor<T>): T {
        return v.visitArrayLiteral(this);
    }

    equals(other: AST): boolean {
        return other instanceof ArrayLiteral &&
            other.elements.length === this.elements.length &&
            other.elements.every((arg, i)=> arg.equals(this.elements[i]));
    }
}

class ArrayLookup implements AST {
    constructor(public array: AST, public index: AST) {}
    visit<T>(v: Visitor<T>): T {
        return v.visitArrayLookup(this);
    }

    equals(other: AST): boolean {
        return other instanceof ArrayLookup &&
            other.array === this.array &&
            other.index.equals(this.index);
    }
}

class Length implements AST {
    constructor(public array: AST) {}
    visit<T>(v: Visitor<T>): T {
        return v.visitLength(this);
    }

    equals(other: AST): boolean {
        return other instanceof Length &&
            other.array.equals(this.array);
    }
}

function assertType(expected: Type, got: Type){
    if(!expected.equals(got)){
        throw(TypeError(`Expected ${expected}, but got ${got}`));
    }
}

class TypeChecker implements Visitor<Type> {
    constructor(
        public locals: Map<string, Type>,
        public functions: Map<string, FunctionType>,
        public currentFunctionReturnType: Type | null
    ) {}

    visitNum(node: Num): Type {
        return new NumberType();
    }
    visitChar(node: Char): Type {
        return new NumberType();
    }
    visitId(node: Id): Type {
        let type = this.locals.get(node.value);
        if(!type){
            throw TypeError(`Undefined variable ${node.value}`);
        }
        return type;
    }
    visitNot(node: Not): Type {
        assertType(new BooleanType(), node.term.visit(this));
        return new BooleanType();
    }
    visitGreaterThan(node: GreaterThan): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new BooleanType();
    }
    visitLessThan(node: LessThan): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new BooleanType();
    }
    visitGreaterThanEqual(node: GreaterThanEqual): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new BooleanType();
    }
    visitLessThanEqual(node: LessThanEqual): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new BooleanType();
    }
    visitEqual(node: Equal): Type {
        let leftType = node.left.visit(this);
        let rightType = node.right.visit(this);
        assertType(leftType, rightType);
        return new BooleanType();
    }
    visitNotEqual(node: NotEqual): Type {
        let leftType = node.left.visit(this);
        let rightType = node.right.visit(this);
        assertType(leftType, rightType);
        return new BooleanType();
    }
    visitAdd(node: Add): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new NumberType();
    }
    visitSubtract(node: Subtract): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new NumberType();
    }
    visitMultiply(node: Multiply): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new NumberType();
    }
    visitDivide(node: Divide): Type {
        assertType(new NumberType(), node.left.visit(this));
        assertType(new NumberType(), node.right.visit(this));
        return new NumberType();
    }
    visitCall(node: Call): Type {
        let expected = this.functions.get(node.callee);
        if(!expected){
            throw TypeError(`Function ${node.callee} is not defined`);
        }
        let argsTypes = new Array<Param>();
        node.args.forEach((arg, i)=>
            argsTypes.push(new Param(`x${i}`, arg.visit(this)))
        )
        let got = new FunctionType(argsTypes, expected.returnType);
        assertType(expected, got);
        return expected.returnType;
    }
    visitReturn(node: Return): Type {
        let type = node.term.visit(this);
        if(this.currentFunctionReturnType){
            assertType(this.currentFunctionReturnType, type);
            return new VoidType();
        }else{
            throw TypeError("Encountered return statement outside any function");
        }
    }
    visitBlock(node: Block): Type {
        node.statements.forEach((statement)=>statement.visit(this));
        return new VoidType();
    }
    visitIf(node: If): Type {
        node.conditional.visit(this);
        node.consequence.visit(this);
        node.alternative.visit(this);
        return new VoidType();
    }
    visitFunc(node: Func): Type {
        this.functions.set(node.name, node.signature);
        let params = new Map<string, Type>();
        node.signature.parameters.forEach((param)=>
            params.set(param.name, param.type)
        );
        let visitor = new TypeChecker(
            params,
            this.functions,
            node.signature.returnType
        );
        node.body.visit(visitor);
        return new VoidType();
    }
    visitVar(node: Var): Type {
        let type = node.value.visit(this);
        this.locals.set(node.name, type);
        return new VoidType();
    }
    visitAssign(node: Assign): Type {
        let variableType = this.locals.get(node.name);
        if(!variableType){
            throw TypeError(`Assignment to an undefined variable ${node.name}`);
        }
        let valueType = node.value.visit(this);
        assertType(variableType, valueType);
        return new VoidType();
    }
    visitWhile(node: While): Type {
        node.conditional.visit(this);
        node.body.visit(this);
        return new VoidType();
    }
    visitBoolean(node: Boolean): Type {
        return new BooleanType();
    }
    visitUndefined(node: Undefined): Type {
        return new VoidType();
    }
    visitNull(node: Null): Type {
        return new VoidType();
    }
    visitArrayLiteral(node: ArrayLiteral): Type {
        if(node.elements.length == 0){
            throw TypeError("Can't infer type of an empty array");
        }
        let types = node.elements.map((element)=> element.visit(this));
        let elementType = types.reduce((prev, next)=>{
            assertType(prev, next);
            return prev;
        });
        return new ArrayType(elementType);
    }
    visitArrayLookup(node: ArrayLookup): Type {
        assertType(new NumberType(), node.index.visit(this));
        let type = node.array.visit(this);
        if(type instanceof ArrayType){
            return type.element;
        }else{
            throw TypeError(`Expected an array, but got ${type}`);
        }
    }
    visitLength(node: Length): Type {
        let type = node.array.visit(this);
        if(type instanceof ArrayType){
            return new NumberType();
        }else{
            throw TypeError(`Expected an array, but got ${type}`);
        }
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

class Environment {
    constructor(public locals: Map<string, number>, public nextLocalOffset: number) {}
}

class Parser<T> {
    constructor(public parse: (source: Source) => (ParseResult<T> | null)) { }

    static regexp(regexp: RegExp): Parser<string> {
        return new Parser(source => source.match(regexp));
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

let ARRAY_TYPE = token(/Array\b/y);
let VOID_TYPE = token(/void\b/y).map((_)=> new VoidType());
let BOOLEAN_TYPE = token(/boolean\b/y).map((_)=> new BooleanType());
let NUMBER_TYPE = token(/number\b/y).map((_)=> new NumberType());

let COMMA = token(/[,]/y);
let SEMICOLON = token(/;/y);
let LEFT_PAREN = token(/[(]/y);
let RIGHT_PAREN = token(/[)]/y);
let LEFT_BRACE = token(/[{]/y);
let RIGHT_BRACE = token(/[}]/y);
let LEFT_BRACKET = token(/\[/y)
let RIGHT_BRACKET = token(/\]/y);
let COLON = token(/:/y);

let UNDEFINED = token(/undefined\b/y).map((_) => new Undefined())
let NULL = token(/null\b/y).map((_) => new Null());



let TRUE = token(/true\b/y).map((_)=> new Boolean(true));
let FALSE = token(/false\b/y).map((_)=> new Boolean(false));
let boolean: Parser<AST> = TRUE.or(FALSE);

let CHAR = token(/['].[']/y).map((chars) => new Char(chars.charAt(1)));
let NUMBER = token(/[0-9]+/y).map((digits) => new Num(parseInt(digits)));
let ID = token(/[a-zA-Z_][a-zA-Z0-9_]*/y);
let id = ID.map((x) => new Id(x));

let NOT = token(/!/y).map((_) => Not);
let EQUAL = token(/==/y).map((_) => Equal);
let NOT_EQUAL = token(/!=/y).map((_) => NotEqual);
let PLUS = token(/[+]/y).map((_) => Add);
let MINUS = token(/[-]/y).map((_) => Subtract);
let STAR = token(/[*]/y).map((_) => Multiply);
let SLASH = token(/[/]/y).map((_) => Divide);
let ASSIGN = token(/=/y).map((_)=> Assign);
let GREATER_THAN = token(/>/y).map((_)=> GreaterThan);
let LESS_THAN = token(/</y).map((_)=> LessThan);
let GREATER_THAN_EQUAL = token(/>=/y).map((_)=> GreaterThanEqual);
let LESS_THAN_EQUAL = token(/<=/y).map((_)=> LessThanEqual);




//expressions
let expression: Parser<AST> = Parser.error("expression parser used before definition");
// args <- (expression (COMMA expression)*)?
let args: Parser<Array<AST>> =
    expression.bind((arg) =>
        Parser.zeroOrMore(COMMA.and(expression))
            .bind((args) =>
                Parser.constant([arg, ...args])
            )
    ).or(Parser.constant([]));
// call <- ID LEFT_PAREN args RIGHT_PAREN
let call: Parser<AST> =
    ID.bind((callee) =>
        LEFT_PAREN.and(args.bind((args) =>
            RIGHT_PAREN.and(Parser.constant(
                callee === "length"
                ? new Length(args[0])
                : new Call(callee, args)
            ))
        ))
    );

//arrayLiteral <- LEFT_BRACKET args RIGHT_BRACKET
let arrayLiteral: Parser<AST> = 
    LEFT_BRACKET.and(args.bind((args)=>
        RIGHT_BRACKET.and(Parser.constant(
            new ArrayLiteral(args)
        ))
    ));

//arrayLookup <-ID LEFT_BRACKET expression RIGHT_BRACKET
let arrayLookup: Parser<AST> = 
    id.bind((array)=>
        LEFT_BRACKET.and(expression.bind((index)=>
            RIGHT_BRACKET.and(Parser.constant(
                new ArrayLookup(array, index)
            ))
        ))
    );

let type: Parser<Type> = Parser.error("type parser used before definition")
//arrayType <- ARRAY LESS_THAN type GREATER_THAN
let arrayType: Parser<ArrayType> = ARRAY_TYPE.and(LESS_THAN).and(type).bind((type)=>
    GREATER_THAN.and(
        Parser.constant(new ArrayType(type))
    )
);

let typeParser: Parser<Type> = VOID_TYPE.or(BOOLEAN_TYPE).or(NUMBER_TYPE).or(arrayType);
//type <- VOID | BOOLEAN | NUMBER | arrayType
type.parse = typeParser.parse;


//scalar <- boolean / NUMBER / CHAR / UNDEFINED / NULL / id
let scalar: Parser<AST> = boolean.or(NUMBER).or(CHAR).or(UNDEFINED).or(NULL).or(id);

// atom <-call / arrayLiteral / arrayLookup / scalar / LEFT_PAREN expression RIGHT_PAREN
let atom: Parser<AST> =
    call.or(arrayLiteral).or(arrayLookup).or(scalar).or(LEFT_PAREN.and(expression).bind((e) =>
        RIGHT_PAREN.and(Parser.constant(e))
    ));

// unary <- NOT? atom
let unary: Parser<AST> =
    Parser.maybe(NOT).bind((not) =>
        atom.map((term) => not ? new Not(term) : term)
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
let statement: Parser<AST> = Parser.error("statement parser used before definition");

// returnStatement <- RETURN expression SEMICOLON
let returnStatement: Parser<AST> = RETURN.and(Parser.maybe(expression)).bind((term)=>
    SEMICOLON.and(Parser.constant(new Return(term?term:new Null())))
);

// expressionStatement <- expression SEMICOLON
let expressionStatement: Parser<AST> = expression.bind((term)=> SEMICOLON.and(Parser.constant(term)));

// ifStatement <- IF LEFT_PAREN expression RIGHT_PAREN statement ELSE statement
let ifStatement: Parser<AST> = IF.and(LEFT_PAREN).and(expression).bind((conditional)=>
    RIGHT_PAREN.and(statement).bind((consequence)=>
        ELSE.and(statement.bind((alternative)=>
            Parser.constant(new If(conditional, consequence, alternative))
        )).or(Parser.constant(new If(conditional, consequence, new Block([]))))
    )
);

// whileStatement <- WHILE LEFT_PAREN expression RIGHT_PAREN statement
let whileStatement: Parser<AST> = WHILE.and(LEFT_PAREN).and(expression).bind((conditional)=>
    RIGHT_PAREN.and(statement).bind((body)=>
        Parser.constant(new While(conditional, body))
    )
);

// varStatement <- VAR ID ASSIGN expression SEMICOLON
let varStatement: Parser<AST> = VAR.and(ID).bind((name)=>
    ASSIGN.and(expression).bind((value)=>
        SEMICOLON.and(Parser.constant(new Var(name, value)))
    )
);

// assignmentStatement <- ID ASSIGN EXPRESSION SEMICOLON
let assignmentStatement: Parser<AST> = ID.bind((name)=>
    ASSIGN.and(expression).bind((value)=>
        SEMICOLON.and(Parser.constant(new Assign(name, value)))
    )
)

// blockStatement <- LEFT_BRACE statement* RIGHT_BRACE
let blockStatement: Parser<AST> = LEFT_BRACE.and(Parser.zeroOrMore(statement)).bind((statements)=>
    RIGHT_BRACE.and(Parser.constant(new Block(statements)))
);

// optionalTypeAnnotation <- (COLON type)?
let optionalTypeAnnotation: Parser<Type> = Parser.maybe(COLON.and(type));

// parameter <- ID optionalTypeAnnotation
let parameter: Parser<Param> = ID.bind((paramName)=>
    optionalTypeAnnotation.bind((paramType)=>
        Parser.constant(new Param(paramName, paramType))
    )
);

//parameters <- (parameter (COMMA parameter)*)?
let parameters: Parser<Array<Param>> = parameter.bind((param)=>
    Parser.zeroOrMore(COMMA.and(parameter)).bind((params)=>
        Parser.constant([param, ...params])
    )
).or(Parser.constant([]))

// functionStatement <- FUNCTION ID LEFT_PAREN parameters RIGHT_PAREN optionalTypeAnnotation blockStatement
let functionStatement: Parser<AST> = FUNCTION.and(ID).bind((name)=>
    LEFT_PAREN.and(parameters).bind((parameters)=>
        RIGHT_PAREN.and(optionalTypeAnnotation).bind((returnType)=>
            blockStatement.bind((block)=>{
                return Parser.constant(
                    new Func(name, new FunctionType(parameters, returnType) ,block)
                )
            })
        )
    )
)

// statement <- returnStatement
//            / ifStatement
//            / whileStatement
//            / varStatement
//            / assignmentStatement
//            / blockStatement
//            / functionStatement
//            / expressionStatement

let statementParser: Parser<AST> = returnStatement
    .or(functionStatement)
    .or(ifStatement)
    .or(whileStatement)
    .or(varStatement)
    .or(assignmentStatement)
    .or(blockStatement)
    .or(expressionStatement);
statement.parse = statementParser.parse;

let parser: Parser<AST> =
    ignored.and(Parser.zeroOrMore(functionStatement)).map((statements)=>
        new Block(statements)
    );

let filePath = process.argv[2];
let fileContents = fs.readFileSync(filePath, 'utf8');

let outputPath = process.argv[3];
let writeStream = fs.createWriteStream(outputPath);
let emit = (data:string)=> writeStream.write(data+"\n", 'utf8');

let ast = parser.parseStringToCompletion(fileContents);
let globals = new Map<string, FunctionType>();
globals.set("putchar", new FunctionType([new Param("x0", new NumberType())], new VoidType()));

ast.visit(new TypeChecker(new Map(), globals, new VoidType()))
ast.visit(new CodeGenerator());