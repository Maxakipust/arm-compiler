function equ(map1: Map<any, any>, map2: Map<any, any>){

    let thisIttr: IterableIterator<any> = map1.values();
    let otherIttr: IterableIterator<any> = map2.values();
    

    let thisVal = thisIttr.next();
    let otherVal = otherIttr.next();
    while(!(thisVal.done)){
        if(!(thisVal.value === otherVal.value)){
            return false;
        }
        thisVal = thisIttr.next();
        otherVal = otherIttr.next();
    }
    return true;
}

let map1 = new Map<string, string>();
map1.set("1", "foo");
map1.set("2", "bar");
let map2 = new Map<string, string>();
map2.set("3", "fooo");
map2.set("4", "bar");

console.log(equ(map1, map2));