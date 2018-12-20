import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import * as astring from 'astring';
import * as estraverse from 'estraverse';



var inFunction = false;
var params = new Map();
var nodeMap = new Map();
var greenLines = [];
var redLines = [];
var ifColors =[];


let firstRun = (ast,env,argenv,inputVector) => {
    estraverse.traverse(ast, {
        enter: function (node) {
            if (node.type == 'FunctionDeclaration'){
                inFunction = true;
                for (let i=0 ; i < node.params.length; i++){
                    let newNode = esprima.parseScript(JSON.stringify(inputVector[i])).body[0].expression;
                    argenv.set(node.params[i].name, newNode);
                }
            }
            else if( (node.type == 'VariableDeclarator' && !inFunction)) //globals
                argenv.set(node.id.name,node.init);
        },
        leave: function (node) {
            if (node.type == 'VariableDeclarator' && inFunction)
                nodeVariableDeclarator(node,env);
            else if (node.type == 'FunctionExpression' || node.type == 'FunctionDeclaration')
                inFunction = false;}
    });
};

let secondRun = (ast,env,argenv, currentEnv) => {
    let returnTree = estraverse.replace(ast, {
        enter: function (node) {
            if( secondRunMap[node.type] != undefined )
                secondRunMap[node.type](ast,env,argenv,node,currentEnv);
        }

    });
    return returnTree;
};

let secondRunIf = (ast,env,argenv,node) => {
    if (node.type == 'IfStatement' && node.visited!= true) {
        let tempMap = new Map(env);
        let tempArg = new Map(argenv);
        subExpression(node.test,env);
        colorStatement(node.test,env,argenv);
        node.visited = true;
        ifColors.push(node.test.color);
        traverse (node.consequent,tempMap,tempArg);
        traverse (node.alternate,env,argenv);
    }
};

let secondRunWhile = (ast,env,argenv, node,currentEnv) => {
    if (node.type == 'WhileStatement' && node.visited!= true) {
        subExpression(node.test,env);
        node.visited = true;
        traverse (node.body,env,argenv);
        env = currentEnv;
    }
};

let secondRunAss = (ast,env,argenv,node) => {
    if(node.type == 'AssignmentExpression' && node.visited!= true){
        node.visited = true;
        subExpression(node.right,env);
        nodeAssignmentExpression(node,env,argenv);
        argAssignmentExpression(node,env,argenv);
    }
};

let secondRunVar = (ast,env,argenv,node) => {
    return subVarExpression(node,env);
};

let secondRunReturn = (ast,env,argenv,node) => {
    if(node.type == 'ReturnStatement' && node.visited!= true)
        node.visited = true;
    return subExpression(node.argument,env);
};

let secondRunMap = {};
secondRunMap.IfStatement = secondRunIf;
secondRunMap.WhileStatement = secondRunWhile;
secondRunMap.AssignmentExpression = secondRunAss;
secondRunMap.VariableDeclarator = secondRunVar;
secondRunMap.ReturnStatement = secondRunReturn;

let traverse = (ast, env, argenv, inputVector) => {
    firstRun(ast, env, argenv, inputVector);
    let currentEnv = env;
    let replacedTree = secondRun(ast, env, argenv, currentEnv);
    let cutTree = estraverse.replace(replacedTree, {
        leave: function (node) {
            if(node.type == 'VariableDeclaration'){
                return this.remove();
            }
            else if (identifierEnvCheck(node,env)) {
                return this.remove();
            }
            else if (arrEnvCheck(node,env))
                return this.remove();
        }
    });
    return cutTree;
};

let identifierEnvCheck = (node,env) => {
    return (node.type == 'ExpressionStatement' &&  node.expression.type == 'AssignmentExpression' && node.expression.left.type == 'Identifier' && env.has(node.expression.left.name));
};

let arrEnvCheck = (node,env) => {
    return (node.type == 'ExpressionStatement' && node.expression.left.type == 'MemberExpression' &&  node.expression.left.object.type == 'Identifier' && env.has(node.expression.left.object.name));
};


let subExpression = (ast,env) => {
    let subtree = estraverse.replace(ast, {
        leave: function (node,parent) {
            if (subIdentifierCheck(node,parent,env)){
                return env.get(node.name);
            }
            else if(node.type === 'MemberExpression' && node.object.type == 'Identifier' && env.has(node.object.name)){
                return env.get(node.object.name).elements[node.property.value];
            }
        },
    });
    return subtree;
};

let subIdentifierCheck = (node,parent,env) => {
    return (node.type === 'Identifier' && parent.type != 'MemberExpression' && env.has(node.name));
};


let subVarExpression = (ast,env) => {
    let subtree = estraverse.replace(ast, {
        enter: function (node,parent) {
            if (parent.init === node )
                return subExpression(node,env);
        }
    });
    return subtree;
};



let nodeVariableDeclarator = (node,env) => {
    env.set(node.id.name,node.init);
};

let nodeAssignmentExpression = (node,env) => {
    if (node.left.type == 'Identifier' && env.has(node.left.name) ){
        env.set(node.left.name,node.right);
    }
    else if(updateArrCheck(node,env)){
        env.get(node.left.object.name).elements[node.left.property.value] = node.right;
    }

};

let updateArrCheck = (node,env) => {
    return (node.left.type == 'MemberExpression' && node.left.object.type == 'Identifier' && env.has(node.left.object.name));
};

let argAssignmentExpression = (ast,env,argenv) => {
    if (ast.left.type == 'Identifier' && argenv.has(ast.left.name)){
        var cloneAst = esprima.parseScript(astring.generate(ast)).body[0].expression;
        let subtree = estraverse.replace(cloneAst.right, {
            leave: function (node,parent) {
                if (node.type === 'Identifier' && parent.type != 'MemberExpression'){
                    //if (argenv.has(node.name)){ קלט תקין
                    return (argenv.get(node.name));
                    //}
                }
            }
        });
        argenv.set(ast.left.name, subtree);
    }
};

let colorStatement = (test, env, argenv) => {
    var cloneTest = esprima.parseScript(astring.generate(test)).body[0].expression;
    estraverse.replace(cloneTest, {
        leave: function (node,parent) {
            if (node.type === 'Identifier' && parent.type != 'MemberExpression'){
                //if (argenv.has(node.name)){ קלט תקין
                return (argenv.get(node.name));
                //}
            }
            else if(checkArr(node,env,argenv)){
                return argenv.get(node.object.name).elements[node.property.value];
            }
        }
    });
    let bool = eval(astring.generate(cloneTest));
    bool? test.color = 'green' : test.color = 'red';

};

let checkArr = (node,env,argenv) => {
    return (node.type === 'MemberExpression' && node.object.type == 'Identifier' && argenv.has(node.object.name));
};


let linesToColor = (ast) =>{
    let k=0;
    let stringTree =  escodegen.generate(ast);
    let cloneTree = esprima.parseScript(stringTree, { loc: true });
    estraverse.traverse(cloneTree, {
        enter: function (node) {
            if (node.type == 'IfStatement'){
                let color = ifColors[k];
                k++;
                if( color == 'red')
                    redLines.push(node.test.loc.start.line);
                else
                    greenLines.push(node.test.loc.start.line);
            }
        }
    });

};
const parseCode = (codeToParse, inputVector) => {
    let parsed = esprima.parseScript(codeToParse, { loc: true });
    let newTree = traverse(parsed, nodeMap, params, inputVector);
    linesToColor(newTree);
    return newTree;
};

/* let updateMapExp = (exp) =>{
let tkey =escodegen.generate(exp.left);
let newValue = escodegen.generate(exp.right);
for (const [key,value] of map){
let reg1= '(?<=[\\s;,()=+*-@!])' +key + '(?=[\\s;,()=+*-@!])';
let reg2 = '^' +key + '(?=[\\s;,()=+*-@!])';
let reg3  = '(?<=[\\s;,()=+*-@!])'+key+'$';
var r1 = new RegExp(reg1, 'g');
var r2 = new RegExp(reg2, 'g');
var r3 = new RegExp(reg3, 'g');
newValue = newValue.replace(r1, value).replace(r2, value).replace(r3, value);
}
map.set(tkey,newValue);
printMap();
}
*/

export {greenLines};
export {redLines};
export {parseCode};
export {traverse};
export {firstRun};
export {secondRun};
