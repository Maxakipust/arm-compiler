export interface Type {
    equals(other: Type): boolean;
    toString(): string;
}

export class BooleanType implements Type {
    constructor() {}
    
    equals(other: Type): boolean {
        return other instanceof BooleanType;
    }
    toString(): string {
        return "boolean";
    }
}

export class NumberType implements Type {
    constructor() {}
    
    equals(other: Type): boolean {
        return other instanceof NumberType;
    }
    toString(): string {
        return "number"
    }
}

export class VoidType implements Type {
    constructor() {}
    
    equals(other: Type): boolean {
        return other instanceof VoidType;
    }
    toString(): string {
        return "void";
    }
}

export class ArrayType implements Type {
    constructor(public element: Type) {}
    equals(other: Type): boolean {
        return other instanceof ArrayType &&
            this.element.equals(other.element);
    }
    toString(): string {
        return `Array<${this.element}>`
    }
}

export class Param {
    constructor(public name: string, public type: Type) {}
    toString(){
        return `${this.name}: ${this.type}`;
    }
}

export class FunctionType implements Type {
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

export class ThreadType implements Type {
    constructor() {}
    equals(other:Type):boolean {
        return other instanceof ThreadType;
    }
    toString(): string {
        return `Thread`;
    }
}

export class StructType implements Type{
    constructor(public name: String) {}
    equals(other:Type):boolean {
        return other instanceof StructType;
    }
    toString(): string {
        return `Struct<${this.name}>`;
    }
}

export class StructEntry{
    constructor(public name: String, public type: Type){};

    equals(other: StructEntry){
        return other.name === this.name &&
            other.type.equals(this.type);
    }

    toString(): String{
        return `${this.name}: ${this.type.toString()}`
    }
}