import { FunctionType, StructEntry, Type } from "./type";
import Visitor from "./visitor";

export interface AST {
    returnType: Type;

    visit<T>(v: Visitor<T>): T;
    equals(other: AST): boolean;
}

export class Str implements AST {
    constructor(public value: string){}
    returnType: Type;

    visit<T>(v:Visitor<T>){
        return v.visitStr(this);
    }

    equals(other: AST): boolean {
        return other instanceof Str &&
            other.value === this.value;
    }
}

export class Num implements AST {
    constructor(public value: number) { }
    returnType: Type;

    visit<T>(v:Visitor<T>){
        return v.visitNum(this);
    }
    
    equals(other: AST): boolean {
        return (other instanceof Num && this.value === other.value);
    }
}

export class Char implements AST {
    constructor(public value: string) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
       return v.visitChar(this);
    }

    equals(other: AST): boolean {
        return other instanceof Char &&
            this.value === other.value;
    }

}

export class Id implements AST {
    constructor(public value: string) { }
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitId(this);
    }


    equals(other: AST): boolean {
        return (other instanceof Id && this.value === other.value);
    }
}

export class Not implements AST {
    constructor(public term: AST) { }
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitNot(this);
    }

    equals(other: AST): boolean {
        return (other instanceof Not && this.term.equals(other.term));
    }
}

export class GreaterThan implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class LessThan implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class GreaterThanEqual implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class LessThanEqual implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class Equal implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class NotEqual implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class Add implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class Subtract implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class Multiply implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class Divide implements AST {
    constructor(public left: AST, public right: AST) { }
    returnType: Type;
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

export class Call implements AST {
    constructor(public callee: string, public args: Array<AST>) { }
    returnType: Type;
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

export class Return implements AST {
    constructor(public term: AST) { }
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitReturn(this);
    }

    equals(other: AST): boolean {
        return other instanceof Return &&
            this.term.equals(other.term);
    }
}

export class Block implements AST {
    constructor(public statements: Array<AST>) { }
    returnType: Type;
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

export class If implements AST {
    constructor(public conditional: AST, public consequence: AST, public alternative: AST) { }
    returnType: Type;
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

export class Func implements AST {
    constructor(public name: string, public signature: FunctionType, public body: AST) { }
    returnType: Type;
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

export class Var implements AST {
    constructor(public name: string, public value: AST) { }
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitVar(this);
    }


    equals(other: AST): boolean {
        return other instanceof Var &&
            this.name === other.name &&
            this.value.equals(other.value);
    }
}

export class Assign implements AST {
    constructor(public name: string, public value: AST) { }
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitAssign(this);
    }

    equals(other: AST): boolean {
        return other instanceof Assign &&
            this.name === other.name &&
            this.value.equals(other.value);
    }
}

export class While implements AST {
    constructor(public conditional: AST, public body: AST) { }
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitWhile(this);
    }

    equals(other: AST): boolean {
        return other instanceof While &&
            this.conditional.equals(other.conditional) &&
            this.body.equals(other.body);
    }
}

export class Bool implements AST {
    constructor(public value: boolean) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitBoolean(this);
    }

    equals(other:AST):boolean {
        return other instanceof Bool
     &&
            other.value === this.value;
    }
}

export class Undefined implements AST {
    constructor() {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitUndefined(this);
    }

    equals(other:AST):boolean {
        return other instanceof Undefined;
    }
}

export class Null implements AST {
    constructor() {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitNull(this);
    }

    equals(other:AST):boolean {
        return other instanceof Null;
    }
}

export class ArrayLiteral implements AST {
    constructor(public elements: Array<AST>) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitArrayLiteral(this);
    }

    equals(other: AST): boolean {
        return other instanceof ArrayLiteral &&
            other.elements.length === this.elements.length &&
            other.elements.every((arg, i)=> arg.equals(this.elements[i]));
    }
}

export class EmptyArray implements AST {
    constructor(public size: AST, public type: Type) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitEmptyArray(this);
    }

    equals(other: AST): boolean {
        return other instanceof EmptyArray &&
            other.size == this.size &&
            other.type.equals(this.type);
    }
}

export class ArrayLookup implements AST {
    constructor(public array: AST, public index: AST) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitArrayLookup(this);
    }

    equals(other: AST): boolean {
        return other instanceof ArrayLookup &&
            other.array.equals(this.array) &&
            other.index.equals(this.index);
    }
}

export class ArrayAssignment implements AST {
    constructor(public array: AST, public index: AST, public value: AST) {}
    returnType: Type;

    visit<T> (v: Visitor<T>): T {
        return v.visitArrayAssignment(this);
    }

    equals(other: AST): boolean {
        return other instanceof ArrayAssignment &&
           other.array === this.array &&
           other.index.equals(this.index) &&
           other.value.equals(this.value) 
    }
}

export class Length implements AST {
    constructor(public array: AST) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitLength(this);
    }

    equals(other: AST): boolean {
        return other instanceof Length &&
            other.array.equals(this.array);
    }
}

export class Thread implements AST {
    constructor(public fn: string){}
    returnType: Type;
    visit<T>(v:Visitor<T>): T {
        return v.visitThread(this);
    }

    equals(other:AST):boolean {
        return other instanceof Thread &&
            (other.fn == this.fn);
    }
}

export class Struct implements AST {
    constructor(public name: String, public values: Array<StructEntry>){}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitStruct(this);
    }
    equals(other: AST): boolean {
        return other instanceof Struct &&
        other.name === this.name &&
        other.values.every((otherEntry, index)=>this.values[index].equals(otherEntry));
    }
}

export class MemberExpression implements AST {
    constructor(public object:Id, public property: Id){}
    visit<T>(v: Visitor<T>): T {
        return v.visitMemberExpression(this);
    }
    equals(other: AST): boolean {
        return other instanceof MemberExpression &&
            other.object.equals(this.object) &&
            other.property.equals(this.property);
    }
    returnType: Type;
    struct: Array<StructEntry>;
}

export class MemberAssignment implements AST {
    constructor(public object: Id, public property: Id, public value: AST){}
    returnType: Type;
    struct: Array<StructEntry>;
    visit<T>(v: Visitor<T>): T {
        return v.visitMemberAssignment(this);
    }
    equals(other: AST): boolean {
        return other instanceof MemberAssignment  && 
            this.object.equals(other.object) &&
            this.property.equals(other.property) &&
            this.value.equals(other.value) &&
            this.returnType.equals(other.returnType);
    }
    
}

export class New implements AST {
    constructor(public name: Id, public args: Array<AST>) {}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitNew(this);
    }
    equals(other: AST): boolean {
        return other instanceof New &&
            other.args.every((arg, index)=>arg.equals(this.args[index])) &&
            other.name.equals(this.name);
    }
    
}

export class Include implements AST {
    constructor(public file: Str){}
    returnType: Type;
    visit<T>(v: Visitor<T>): T {
        return v.visitInclude(this);
    }
    equals(other: AST): boolean {
        return other instanceof Include &&
            other.file === this.file;
    }
}