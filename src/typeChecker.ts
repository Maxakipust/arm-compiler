import Visitor from "./visitor";
import * as Type from './type';
import * as AST from "./ast";

export default class TypeChecker implements Visitor<Type.Type> {
    constructor(
        public locals: Map<string, Type.Type>,
        public functions: Map<string, Type.FunctionType>,
        public currentFunctionReturnType: Type.Type | null
    ) {}

    visitNum(node: AST.Num): Type.Type {
        return new Type.NumberType();
    }
    visitChar(node: AST.Char): Type.Type {
        return new Type.NumberType();
    }
    visitId(node: AST.Id): Type.Type {
        let type = this.locals.get(node.value);
        if(!type){
            throw TypeError(`Undefined variable ${node.value}`);
        }
        return type;
    }
    visitNot(node: AST.Not): Type.Type {
        assertType(new Type.BooleanType(), node.term.visit(this));
        return new Type.BooleanType();
    }
    visitGreaterThan(node: AST.GreaterThan): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.BooleanType();
    }
    visitLessThan(node: AST.LessThan): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.BooleanType();
    }
    visitGreaterThanEqual(node: AST.GreaterThanEqual): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.BooleanType();
    }
    visitLessThanEqual(node: AST.LessThanEqual): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.BooleanType();
    }
    visitEqual(node: AST.Equal): Type.Type {
        let leftType = node.left.visit(this);
        let rightType = node.right.visit(this);
        assertType(leftType, rightType);
        return new Type.BooleanType();
    }
    visitNotEqual(node: AST.NotEqual): Type.Type {
        let leftType = node.left.visit(this);
        let rightType = node.right.visit(this);
        assertType(leftType, rightType);
        return new Type.BooleanType();
    }
    visitAdd(node: AST.Add): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.NumberType();
    }
    visitSubtract(node: AST.Subtract): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.NumberType();
    }
    visitMultiply(node: AST.Multiply): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.NumberType();
    }
    visitDivide(node: AST.Divide): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        return new Type.NumberType();
    }
    visitCall(node: AST.Call): Type.Type {
        let expected = this.functions.get(node.callee);
        if(!expected){
            throw TypeError(`Function ${node.callee} is not defined`);
        }
        let argsTypes = new Array<Type.Param>();
        node.args.forEach((arg, i)=>
            argsTypes.push(new Type.Param(`x${i}`, arg.visit(this)))
        )
        let got = new Type.FunctionType(argsTypes, expected.returnType);
        assertType(expected, got);
        return expected.returnType;
    }
    visitReturn(node: AST.Return): Type.Type {
        let type = node.term.visit(this);
        if(this.currentFunctionReturnType){
            assertType(this.currentFunctionReturnType, type);
            return new Type.VoidType();
        }else{
            throw TypeError("Encountered return statement outside any function");
        }
    }
    visitBlock(node: AST.Block): Type.Type {
        node.statements.forEach((statement)=>statement.visit(this));
        return new Type.VoidType();
    }
    visitIf(node: AST.If): Type.Type {
        node.conditional.visit(this);
        node.consequence.visit(this);
        node.alternative.visit(this);
        return new Type.VoidType();
    }
    visitFunc(node: AST.Func): Type.Type {
        this.functions.set(node.name, node.signature);
        let params = new Map<string, Type.Type>();
        node.signature.parameters.forEach((param)=>
            params.set(param.name, param.type)
        );
        let visitor = new TypeChecker(
            params,
            this.functions,
            node.signature.returnType
        );
        node.body.visit(visitor);
        return new Type.VoidType();
    }
    visitVar(node: AST.Var): Type.Type {
        let type = node.value.visit(this);
        this.locals.set(node.name, type);
        return new Type.VoidType();
    }
    visitAssign(node: AST.Assign): Type.Type {
        let variableType = this.locals.get(node.name);
        if(!variableType){
            throw TypeError(`Assignment to an undefined variable ${node.name}`);
        }
        let valueType = node.value.visit(this);
        assertType(variableType, valueType);
        return new Type.VoidType();
    }
    visitWhile(node: AST.While): Type.Type {
        node.conditional.visit(this);
        node.body.visit(this);
        return new Type.VoidType();
    }
    visitBoolean(node: AST.Bool): Type.Type {
        return new Type.BooleanType();
    }
    visitUndefined(node: AST.Undefined): Type.Type {
        return new Type.VoidType();
    }
    visitNull(node: AST.Null): Type.Type {
        return new Type.VoidType();
    }
    visitArrayLiteral(node: AST.ArrayLiteral): Type.Type {
        if(node.elements.length == 0){
            throw TypeError("Can't infer type of an empty array");
        }
        let types = node.elements.map((element)=> element.visit(this));
        let elementType = types.reduce((prev, next)=>{
            assertType(prev, next);
            return prev;
        });
        return new Type.ArrayType(elementType);
    }
    visitArrayLookup(node: AST.ArrayLookup): Type.Type {
        assertType(new Type.NumberType(), node.index.visit(this));
        let type = node.array.visit(this);
        if(type instanceof Type.ArrayType){
            return type.element;
        }else{
            throw TypeError(`Expected an array, but got ${type}`);
        }
    }
    visitLength(node: AST.Length): Type.Type {
        let type = node.array.visit(this);
        if(type instanceof Type.ArrayType){
            return new Type.NumberType();
        }else{
            throw TypeError(`Expected an array, but got ${type}`);
        }
    }
}

function assertType(expected: Type.Type, got: Type.Type){
    if(!expected.equals(got)){
        throw(TypeError(`Expected ${expected}, but got ${got}`));
    }
}