import assert from 'assert';
import {parseCode, firstRun, secondRun} from '../src/js/code-analyzer';
import * as astring from 'astring';
import * as esprima from 'esprima';


describe('(1) The javascript program', () => {
    it('is substituting the tree correctly (if)', () => {
        let inputVector = `1,2,3`;
        let code = `function foo(x, y, z){
            let a = x + 1;
            let b = a + y;
            let c = 0;

            if (b < z) {
                c = c + 5;
                return x + y + z + c;
            } else if (b < z * 2) {
                c = c + x + 5;
                return x + y + z + c;
            } else {
                c = c + z + 5;
                return x + y + z + c;
            }
        }`;
        let mod =
         `function foo(x, y, z) {
  if (x + 1 + y < z) {
    return x + y + z + (0 + 5);
  } else if (x + 1 + y < z * 2) {
    return x + y + z + (0 + x + 5);
  } else {
    return x + y + z + (0 + z + 5);
  }
}
`
        let parsedCode = parseCode(code,inputVector);
        assert.equal(astring.generate(parsedCode) , mod );
    })});

    describe('(2) The javascript program', () => {
        it('is substituting the tree correctly (while fakse)', () => {
            let inputVector = `1,2,3`;
            let code = `function foo(x, y, z){
                let a = x + 1;
                let b = a + y;
                let c = 0;

                while (a < z) {
                    c = a + b;
                    z = c * 2;
                }

                return z;
            }
            `;
            let mod = `function foo(x, y, z) {
  while (x + 1 < z) {
    z = (x + 1 + (x + 1 + y)) * 2;
  }
  return z;
}
`
            let parsedCode = parseCode(code,inputVector);
            assert.equal(astring.generate(parsedCode),mod );
        })});

        describe('(3) The javascript program', () => {
            it('is substituting the tree correctly (array)', () => {
                let inputVector = `1,2,3`;
                let code = `function foo(x, y, z){
                    let a = x + 1;
                    let b = a + y;
                    let c = 0;
                    let d = [10,20,30];

                    if (d[0] < z) {
                        c = d[1];
                        return x + y + z + c;
                    } else{
                        c = c + x + 5;
                        return x + y + z + c;
                    }

                }
                `;
                let mod = `function foo(x, y, z) {
  if (10 < z) {
    return x + y + z + 20;
  } else {
    return x + y + z + (0 + x + 5);
  }
}
`
                let parsedCode = parseCode(code,inputVector);
                assert.equal(astring.generate(parsedCode),mod );
            })});

    describe('(4) The javascript program', () => {
                it('is substituting the tree correctly (array assignment)', () => {
                    let inputVector = `1,2,3`;
                    let code = `function foo(x, y, z){
                    let a = x + 1;
                    let b = a + y;
                    let c = 0;
                    let d = [10,20,30];

                    if (d[0] < z) {
                        d[1] = c;
                        return x + y + z + d[1];
                    } else{
                        d[1] = c + x + 5;
                        return x + y + z + d[1];
                    }

                }
                    `;
                    let mod = `function foo(x, y, z) {
  if (10 < z) {
    return x + y + z + 0;
  } else {
    return x + y + z + (0 + x + 5);
  }
}
`
                    let parsedCode = parseCode(code,inputVector);
                    assert.equal(astring.generate(parsedCode),mod );
                })});

                describe('(5) The javascript program', () => {
                    it('is substituting the tree correctly (while true)', () => {
                        let inputVector = `1,8,3`;
                        let code = `function foo(x, y, z){
                            let a = x + 1;
                            let b = a + y;
                            let c = 0;

                            while (a < z) {
                                c = a + b;
                                z = c * 2;
                            }

                            return z;
                        }
                        `;
                        let mod = `function foo(x, y, z) {
  while (x + 1 < z) {
    z = (x + 1 + (x + 1 + y)) * 2;
  }
  return z;
}
`
                        let parsedCode = parseCode(code,inputVector);
                        assert.equal(astring.generate(parsedCode),mod );
                    })});

                    describe('(6) The javascript program', () => {
                        it('is substituting the tree correctly (while in if)', () => {
                            let inputVector = `1,8,3`;
                            let code = `function foo(x, y, z){
let a = x + 1;
let b = a + y;
let c = 0;

   if (a < z) {
      while (b < z){
        c = a + b;
        z = c * 2;
      }
    return z;
    }
    else{
    return z;
    }
     }
                            `;
                            let mod = `function foo(x, y, z) {
  if (x + 1 < z) {
    while (x + 1 + y < z) {
      z = (x + 1 + (x + 1 + y)) * 2;
    }
    return z;
  } else {
    return z;
  }
}
`
                            let parsedCode = parseCode(code,inputVector);
                            assert.equal(astring.generate(parsedCode),mod );
                        })});


                        describe('(7) The javascript program', () => {
                                    it('is substituting the tree correctly (globals)', () => {
                                        let inputVector = `1,2,3`;
                                        let code = `
let g = 2;
function foo(x, y, z){
    while (x + 1 < z) {
        z = (x + 1 + x + 1 + y) * 2;
        y = x * g;
    }

    return z;
}
    `;
let mod = `function foo(x, y, z) {
  while (x + 1 < z) {
    z = (x + 1 + x + 1 + y) * 2;
    y = x * g;
  }
  return z;
}
`
                                        let parsedCode = parseCode(code,inputVector);
                                        assert.equal(astring.generate(parsedCode),mod );
                                    })});

                                    describe('(8) The javascript program', () => {
                                                it('is substituting the tree correctly (globals2)', () => {
                                                    let inputVector = `1,2,3`;
                                                    let code = `
                                                    let g = [1,2,3];
                                                    let k =2;
                                                    function foo(x, y, z){

                                                        if (g[2] + 1 > z) {
                                                            z = (x + 1 + x + 1 + y) * 2;
                                                            y = x * g;
                                                        }
                                                    else{
                                                        return z;
                                                    }
                                                    }
                                                    `;
            let mod = `function foo(x, y, z) {
  if (g[2] + 1 > z) {
    z = (x + 1 + x + 1 + y) * 2;
    y = x * g;
  } else {
    return z;
  }
}
`
                                                    let parsedCode = parseCode(code,inputVector);
                                                    assert.equal(astring.generate(parsedCode),mod );
                                                })});


    describe('(9) The javascript program', () => {
        it('is substituting the tree correctly (second run check)', () => {
let inputVector = [1,2,3];
let env = new Map();
let argenv = new Map ();
let code = `let g = [1,2,3];
let k =2;
function foo(x, y, z){
    let a = x + z;
    if (g[2] + 1 > z) {
        z = (x + 1 + x + 1 + y) * 2;
        return a * g;
    }
else{
    return z;
}
}`;
let mod =
 `let g = [1, 2, 3];
let k = 2;
function foo(x, y, z) {
  let a = x + z;
  if (g[2] + 1 > z) {
    z = (x + 1 + x + 1 + y) * 2;
    return (x + z) * g;
  } else {
    return z;
  }
}
`
            let ast = esprima.parseScript(code, {loc: true});
            firstRun(ast,env,argenv,inputVector);
            let secondTree = secondRun(ast,env,argenv,new Map(env));
            assert.equal(astring.generate(secondTree) , mod );
        })});

        describe('(10) The javascript program', () => {
            it('is substituting the tree correctly (second run check)', () => {
    let inputVector = [1,2,3];
    let env = new Map();
    let argenv = new Map ();
    let code = `function foo(x, y, z){
    let a = x + 1;
    let b = a + y;
    let c = 0;

    if (b < z) {
        c = c + 5;
        return x + y + z + c;
    } else if (b < z * 2) {
        c = c + x + 5;
        return x + y + z + c;
    } else {
        c = c + z + 5;
        return x + y + z + c;
    }
}
`;
    let mod =
     `function foo(x, y, z) {
  let a = x + 1;
  let b = x + 1 + y;
  let c = 0;
  if (x + 1 + y < z) {
    return x + y + z + (0 + 5);
  } else if (x + 1 + y < z * 2) {
    return x + y + z + (0 + x + 5);
  } else {
    return x + y + z + (0 + z + 5);
  }
}
`
                let ast = esprima.parseScript(code, {loc: true});
                firstRun(ast,env,argenv,inputVector);
                let secondTree = secondRun(ast,env,argenv,new Map(env));
                assert.equal(astring.generate(secondTree) , mod );
            })});
