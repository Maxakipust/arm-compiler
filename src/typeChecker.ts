import Visitor from "./visitor";
import * as Type from './type';
import * as AST from "./ast";

export default class TypeChecker implements Visitor<Type.Type> {
    constructor(
        public locals: Map<string, Type.Type>,
        public functions: Map<string, Type.FunctionType>,
        public currentFunctionReturnType: Type.Type | null
    ) {}
    visitEmptyArray(node: AST.EmptyArray): Type.Type {
        assertType(new Type.NumberType(), node.size.visit(this));
        node.returnType = new Type.ArrayType(node.type);
        return node.returnType;
    }

    visitArrayAssignment(node: AST.ArrayAssignment): Type.Type {
        assertType(new Type.NumberType(), node.index.visit(this));
        node.value.visit(this);
        node.returnType = new Type.VoidType();
        return node.returnType;
    }

    visitNum(node: AST.Num): Type.Type {
        node.returnType = new Type.NumberType();
        return node.returnType;
    }
    visitChar(node: AST.Char): Type.Type {
        node.returnType = new Type.NumberType();
        return node.returnType;
    }
    visitId(node: AST.Id): Type.Type {
        let type = this.locals.get(node.value);
        if(!type){
            throw TypeError(`Undefined variable ${node.value}`);
        }
        node.returnType = type;
        return type;
    }
    visitNot(node: AST.Not): Type.Type {
        assertType(new Type.BooleanType(), node.term.visit(this));
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitGreaterThan(node: AST.GreaterThan): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitLessThan(node: AST.LessThan): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitGreaterThanEqual(node: AST.GreaterThanEqual): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitLessThanEqual(node: AST.LessThanEqual): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitEqual(node: AST.Equal): Type.Type {
        let leftType = node.left.visit(this);
        let rightType = node.right.visit(this);
        assertType(leftType, rightType);
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitNotEqual(node: AST.NotEqual): Type.Type {
        let leftType = node.left.visit(this);
        let rightType = node.right.visit(this);
        assertType(leftType, rightType);
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitAdd(node: AST.Add): Type.Type {
        let leftType = node.right.visit(this);
        let rightType = node.left.visit(this)
        assertType(leftType, rightType);
        if(! (leftType.equals(new Type.NumberType) || leftType instanceof Type.ArrayType)){
            throw(TypeError(`Expected number or Array, but got ${leftType}`));
        }
        node.returnType = leftType;
        return leftType;
    }
    visitSubtract(node: AST.Subtract): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.NumberType();
        return node.returnType;
    }
    visitMultiply(node: AST.Multiply): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.NumberType();
        return node.returnType;
    }
    visitDivide(node: AST.Divide): Type.Type {
        assertType(new Type.NumberType(), node.left.visit(this));
        assertType(new Type.NumberType(), node.right.visit(this));
        node.returnType = new Type.NumberType();
        return node.returnType;
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
        node.returnType = expected.returnType;
        return expected.returnType;
    }
    visitReturn(node: AST.Return): Type.Type {
        let type = node.term.visit(this);
        if(this.currentFunctionReturnType){
            assertType(this.currentFunctionReturnType, type);
            node.returnType = new Type.VoidType();
            return node.returnType;
        }else{
            throw TypeError("Encountered return statement outside any function");
        }
    }
    visitBlock(node: AST.Block): Type.Type {
        node.statements.forEach((statement)=>statement.visit(this));
        node.returnType = new Type.VoidType();
        return node.returnType;
    }
    visitIf(node: AST.If): Type.Type {
        node.conditional.visit(this);
        node.consequence.visit(this);
        node.alternative.visit(this);
        node.returnType = new Type.VoidType();
        return node.returnType;
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
        node.returnType = new Type.VoidType();
        return node.returnType;
    }
    visitVar(node: AST.Var): Type.Type {
        let type = node.value.visit(this);
        this.locals.set(node.name, type);
        node.returnType = new Type.VoidType();
        return node.returnType;
    }
    visitAssign(node: AST.Assign): Type.Type {
        let variableType = this.locals.get(node.name);
        if(!variableType){
            throw TypeError(`Assignment to an undefined variable ${node.name}`);
        }
        let valueType = node.value.visit(this);
        assertType(variableType, valueType);
        node.returnType = new Type.VoidType();
        return node.returnType;
    }
    visitWhile(node: AST.While): Type.Type {
        node.conditional.visit(this);
        node.body.visit(this);
        node.returnType = new Type.VoidType();
        return node.returnType;
    }
    visitBoolean(node: AST.Bool): Type.Type {
        node.returnType = new Type.BooleanType();
        return node.returnType;
    }
    visitUndefined(node: AST.Undefined): Type.Type {
        node.returnType = new Type.VoidType();
        return node.returnType;
    }
    visitNull(node: AST.Null): Type.Type {
        node.returnType = new Type.VoidType();
        return node.returnType;
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
        node.returnType = new Type.ArrayType(elementType);
        return node.returnType;
    }
    visitArrayLookup(node: AST.ArrayLookup): Type.Type {
        assertType(new Type.NumberType(), node.index.visit(this));
        let type = node.array.visit(this);
        if(type instanceof Type.ArrayType){
            node.returnType = type.element;
            return type.element;
        }else{
            throw TypeError(`Expected an array, but got ${type}`);
        }
    }
    visitLength(node: AST.Length): Type.Type {
        let type = node.array.visit(this);
        if(type instanceof Type.ArrayType){
            node.returnType = new Type.NumberType();
            return node.returnType;
        }else{
            throw TypeError(`Expected an array, but got ${type}`);
        }
    }

    visitStr(node: AST.Str): Type.Type {
        node.returnType = new Type.ArrayType(new Type.NumberType);
        return node.returnType;
    }
}

function assertType(expected: Type.Type, got: Type.Type){
    if(!expected.equals(got)){
        throw(TypeError(`Expected ${expected}, but got ${got}`));
    }
}
