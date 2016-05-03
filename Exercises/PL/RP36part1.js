/* global console,  SLang, PLutils */
(function() {
  "use strict";

    var RP36part1 = {    

	init: function() {
	    var SL = SLang;
	    var A = SL.absyn;
	    var E = SL.env;
	    var vTop, vTopCount, vMid, vMidCount, mMid, vBot, vBotCount, mBot;
	    var ast, cNames, mNames;

	    function initRandomParts() {
		var i;
		var classNames = [ ["A","B","C"],
				   ["C1","C2","C3"],
				   ["C","D","E"],
				   ["X","Y","Z"] ];
		
		var methodNames = [ ["f","g","h"],
				    ["i","j","k"],
				    ["m1","m2","m3"],
				    ["f1","f2","f3"],
				    ["g1","g2","g3"] ];
		
		var varNames = [ ["a","b","c"],
				 ["b","c","d"],
				 ["c","d","e"],
				 ["p","q","r"],
				 ["x","y","z"],
				 ["u","v","w"],
				 ["s","t","u"] ];
		cNames = classNames[ PLutils.getRnd(0,classNames.length-1)];
		// root (top) class
		vTop = varNames[ PLutils.getRnd(0,varNames.length-1)];
		vTopCount = PLutils.getRnd(1,3);
		// no methods, just initialize

		// middle class
		vMid = varNames[ PLutils.getRnd(0,varNames.length-1)];
		vMidCount = PLutils.getRnd(1,3);
		mMid = methodNames[ PLutils.getRnd(0,methodNames.length-1)];

		// bottom class
		vBot = varNames[ PLutils.getRnd(0,varNames.length-1)];
		vBotCount = PLutils.getRnd(1,3);
		mBot = methodNames[ PLutils.getRnd(0,methodNames.length-1)];
	    }// initRandomParts function

	    function buildAST() {
		var classes = [];
		var i, j, classIndex, numIVars, iVars, methods;
		var methodIndex = 0, params;
		var body, fn, args, mainBody;
		var iVars, methods, params;

		// top class
		PLutils.shuffle(vTop);
		iVars = [];
		for(i=0; i<vTopCount; i++) { iVars.push(vTop[i]);  }
		switch (vTopCount) {
		    case 1: 
		    params = [ "m" ]; 
		    body = [A.createAssignExp(vTop[0],A.createVarExp("m"))]; 
		    break;
		    case 2: 
		    params = [ "m", "n" ]; 
		    body = [ A.createAssignExp(vTop[0],A.createVarExp("m")),
			     A.createAssignExp(vTop[1],A.createVarExp("n")) ]; 
		    break;
		    case 3: 
		    params = [ "m", "n", "o" ]; 
		    body = [ A.createAssignExp(vTop[0],A.createVarExp("m")),
			     A.createAssignExp(vTop[1],A.createVarExp("n")),
			     A.createAssignExp(vTop[2],A.createVarExp("o")) ]; 

		    break;
		}
		methods = [];
		methods.push(A.createMethod("initialize",params,body));
		classes.push(A.createClass(cNames[0],"Object",iVars,methods));

		// middle class
		PLutils.shuffle(vMid);
		iVars = [];
		for(i=0; i<vMidCount; i++) { iVars.push(vMid[i]);  }
		methods = [];
		params = [ "m", "n", "o"];
		for(i=0; i<vMidCount; i++) { 
		    methods.push(A.createMethod(
			mMid[i],[params[i]],
			[ A.createAssignExp(iVars[i],
					    A.createVarExp(params[i])) ]));
		}
		classes.push(A.createClass(cNames[1],cNames[0],iVars,methods));

		// bottom class
		PLutils.shuffle(vBot);
		iVars = [];
		for(i=0; i<vBotCount; i++) { iVars.push(vBot[i]);  }
		methods = [];
		for(i=0; i<vBotCount; i++) { 
		    methods.push(A.createMethod(
			mBot[i],[params[i]],
			[ A.createAssignExp(iVars[i],
					    A.createVarExp(params[i])) ]));
		}
		classes.push(A.createClass(cNames[2],cNames[1],iVars,methods));

		// main body
		body = [];
		for(i=0; i<vMidCount; i++) {
		    body.push( A.createMethodCall(
			A.createVarExp("o"),
			mMid[i],
			[A.createIntExp(PLutils.getRnd(1,9)) ] ));
		}
		for(i=0; i<vBotCount; i++) {
		    body.push( A.createMethodCall(
			A.createVarExp("o"),
			mBot[i],
			[A.createIntExp(PLutils.getRnd(1,9)) ] ));
		}
		body.push(A.createPrintExp(A.createVarExp("o")));
		fn = A.createFnExp(["o"],body);
		args = [];
		for(i=0; i<vTopCount; i++) {
		    args.push(A.createIntExp(PLutils.getRnd(1,9)));
		}
		mainBody = [ A.createAppExp(
		    fn,
		    [ "args", A.createNewExp(cNames[2],args) ] ) ];
		return A.createProgram(classes,mainBody);

	    }

	    function getSourceForMethod(m) {
		var i, numMethods;
		var code = "  method " + A.getMethodName(m) + " (" +
		    A.getMethodParams(m) + ") { ";
		numMethods = A.getMethodBody(m).length;
		for(i=0; i<numMethods-1; i++) {
		    code += SLang.printExp(A.getMethodBody(m)[i]) + "; ";
		}
		code += SLang.printExp(A.getMethodBody(m)[numMethods-1]) + " }"
		return code;
	    }
	    function getSourceForClass(c) {
		var i, code = [];
		var numVars = A.getClassIvars(c).length;
		var numMethods = A.getClassMethods(c).length;
		var iVars = " ";
		code.push("class " + A.getClassName(c) + " extends " +
		    A.getClassSuperClass(c) + " {");
		for(i=0; i<numVars; i++) {
		    iVars += " protected " + A.getClassIvars(c)[i];
		}
		if (iVars.length > 1) {  // at least one instance variable
		    code.push(iVars);
		}
		for(i=0; i<numMethods; i++) {
		   code = code.concat(getSourceForMethod(
		       A.getClassMethods(c)[i]));
		}
		code.push("}");
		return code;
	    }
	    function getSourceCode(ast) {
		var code = [];
		var classes = A.getProgramDecls(ast);
		var mainMethodCall = A.getProgramMainBody(ast)[0];
		var i, args;
		var mainBody, newExp, newExpArgs, fn, body;
		newExp = A.getAppExpArgs(mainMethodCall)[0];
		newExpArgs = A.getNewExpArgs(newExp);
		fn = A.getAppExpFn(mainMethodCall);		
		body = A.getFnExpBody(fn);
		for(i=0; i<classes.length; i++) {
		    code = code.concat(getSourceForClass(classes[i]));
		}
		code.push("public class Driver extends Object {");
		code.push("  method main() {");
		code.push("    let");
		args = [];
		for(i=0; i<newExpArgs.length; i++) {
		    args.push(A.getIntExpValue(newExpArgs[i]));
		}
		code.push("        o = new " + cNames[2] + "(" + args + ")" );
		code.push("    in");
		for(i=0; i<body.length-2 ; i++) {
		    code.push("      " + SLang.printExp(body[i]) + ";");
		}
		code.push("      " + SLang.printExp(body[body.length-2]));
		// note that the print statement is NOT displayed
		code.push("    end");
		code.push("  }");
		code.push("}");
		return code;
	    }// getSourceCode function


function RP36part1EvalExp(exp,envir) {
    var f, v, args, values, obj, sup;
    if (A.isIntExp(exp)) {
	return E.createNum(A.getIntExpValue(exp));
    } else if (A.isVarExp(exp)) {
	return E.lookup(envir,A.getVarExpId(exp));
    } else if (A.isPrintExp(exp)) {
	SLang.output += JSON.stringify(
	    RP36part1EvalExp( A.getPrintExpExp(exp), envir ));
    } else if (A.isPrint2Exp(exp)) {
	console.log( A.getPrint2ExpString(exp) +
		     (A.getPrint2ExpExp(exp) !== null ?
		      " " + JSON.stringify( RP36part1EvalExp( A.getPrint2ExpExp(exp), 
						     envir ) )
		      : ""));
    } else if (A.isAssignExp(exp)) {
	v = RP36part1EvalExp(A.getAssignExpRHS(exp),envir);
	E.lookupReference(
                        envir,A.getAssignExpVar(exp))[0] = v;
	return v;
    } else if (A.isFnExp(exp)) {
	return E.createClo(A.getFnExpParams(exp),
				   A.getFnExpBody(exp),envir);
    } else if (A.isAppExp(exp)) {
	f = RP36part1EvalExp(A.getAppExpFn(exp),envir);
	args = RP36part1EvalExps(A.getAppExpArgs(exp),envir);
	if (E.isClo(f)) {
	    if (E.getCloParams(f).length !== args.length) {		
		throw new Error("Runtime error: wrong number of arguments in " +
				"a function call (" + E.getCloParams(f).length +
				" expected but " + args.length + " given)");
	    } else {
		values = RP36part1EvalExps(E.getCloBody(f),
			          E.update(E.getCloEnv(f),
					   E.getCloParams(f),args));
		return values[values.length-1];
	    }
	} else {
	    throw f + " is not a closure and thus cannot be applied.";
	}
    } else if (A.isPrim1AppExp(exp)) {
        return applyPrimitive(A.getPrim1AppExpPrim(exp),
			      [RP36part1EvalExp(A.getPrim1AppExpArg(exp),envir)]);
    } else if (A.isPrim2AppExp(exp)) {
        return applyPrimitive(A.getPrim2AppExpPrim(exp),
			      [RP36part1EvalExp(A.getPrim2AppExpArg1(exp),envir),
			       RP36part1EvalExp(A.getPrim2AppExpArg2(exp),envir)]);
    } else if (A.isIfExp(exp)) {
	if (E.getBoolValue(RP36part1EvalExp(A.getIfExpCond(exp),envir))) {
	    return RP36part1EvalExp(A.getIfExpThen(exp),envir);
	} else {
	    return RP36part1EvalExp(A.getIfExpElse(exp),envir);
	}
    } else if (A.isThisExp(exp)) {
	return E.lookup(envir,"_this");
    } else if (A.isNewExp(exp)) {
	args = RP36part1EvalExps(A.getNewExpArgs(exp),envir);
	obj = SLang.makeNewObject(A.getNewExpClass(exp));
	SLang.findAndInvokeMethod("initialize",A.getNewExpClass(exp),obj,args);
        return obj;
    } else if (A.isMethodCall(exp)) {
	obj = RP36part1EvalExp(A.getMethodCallObject(exp),envir);
	args = RP36part1EvalExps(A.getMethodCallArgs(exp),envir);
	return SLang.findAndInvokeMethod(A.getMethodCallMethod(exp),
				   SLang.getClassNameInterp(E.getObjectState(obj)),
				   obj, 
				   args
				   );
    } else if (A.isSuperCall(exp)) {
	obj = E.lookup(envir,"_this");
	sup = E.lookup(envir,"_super");
	args = RP36part1EvalExps(A.getSuperCallArgs(exp),envir);
	return SLang.findAndInvokeMethod(A.getSuperCallMethod(exp),
				   E.getClassNameName(sup),
				   obj, 
				   args
				   );
    } else {
	throw new Error("Error: Attempting to evaluate an invalid expression");
    }
}
	    function RP36part1EvalExps(list,envir) {
		return list.map( function(e) { return RP36part1EvalExp(e,envir); } );
	    }


	    initRandomParts();
	    ast = buildAST();
	    // eval the program
	    SLang.output = "";
	    SLang.elaborateDecls(A.getProgramDecls(ast));
	    var values = RP36part1EvalExps(A.getProgramMainBody(ast),
				       E.createEmptyEnv());
	    this.program = getSourceCode(ast).join("<br />");
	    this.answer = SLang.output;
	    console.log(this.answer);
	}, // init function

	validateAnswer: function (guess) {
	    return this.answer.replace(/\s+/g,"") ===
		guess.replace(/\s+/g,"");
	}// validateAnswer function

    };

    window.RP36part1 = window.RP36part1 || RP36part1;

}());


