import * as llvm from 'llvm-node';

const context = new llvm.LLVMContext();
const module = new llvm.Module("test", context);

const builder = new llvm.IRBuilder(context);

const right = llvm.ConstantInt.get(context, 5);
const left = llvm.ConstantInt.get(context, 3);
builder.createAdd(right, left);

const ll = module.print();
console.log(ll);
llvm.writeBitcodeToFile(module, "test");