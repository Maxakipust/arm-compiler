import * as AST from "./ast";

export default interface Visitor<T> {
    visitNum(node: AST.Num): T;
    visitChar(node: AST.Char): T;
    visitId(node: AST.Id): T;
    visitNot(node: AST.Not): T;
    visitGreaterThan(node: AST.GreaterThan): T;
    visitLessThan(node: AST.LessThan): T;
    visitGreaterThanEqual(node: AST.GreaterThanEqual): T;
    visitLessThanEqual(node: AST.LessThanEqual): T;
    visitEqual(node: AST.Equal): T;
    visitNotEqual(node: AST.NotEqual): T;
    visitAdd(node: AST.Add): T;
    visitSubtract(node: AST.Subtract): T;
    visitMultiply(node: AST.Multiply): T;
    visitDivide(node: AST.Divide): T;
    visitCall(node: AST.Call): T;
    visitReturn(node: AST.Return): T;
    visitBlock(node: AST.Block): T;
    visitIf(node: AST.If): T;
    visitFunc(node: AST.Func): T;
    visitVar(node: AST.Var): T;
    visitAssign(node: AST.Assign): T;
    visitWhile(node: AST.While): T;
    visitBoolean(node: AST.Bool): T;
    visitUndefined(node: AST.Undefined): T;
    visitNull(node: AST.Null): T;
    visitArrayLiteral(node: AST.ArrayLiteral): T;
    visitArrayLookup(node: AST.ArrayLookup): T;
    visitLength(node: AST.Length): T;
    visitArrayAssignment(node: AST.ArrayAssignment): T;
    visitStr(node: AST.Str): T;
    visitEmptyArray(node: AST.EmptyArray): T;
    visitThread(node: AST.Thread): T;
}
