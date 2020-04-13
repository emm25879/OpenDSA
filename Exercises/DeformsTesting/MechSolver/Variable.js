class Variable{
    constructor(id, name, varName, symbol, domain, element, globalPointerReference){
        this.id = id;   // Fully qualified id that has variable name, equation, and workspace id
        // console.log(this.id)
        this.name = name;   // Only contains the context name for the quantity; eg: deform, thermalcoeff

        this.parentSymbolTemplate = symbol; // Stores the original symbol LaTeX for restoration from subscripting
        this.parentSymbol = symbol; // Stores the current symbol, related to subscripting
        this.currentSymbol = varName;   // id generated by Window.getVarName, of the type x_y etc, internal use only.

        this.expectedDomain = domain;
        this.currentDomain = null;
        this.currentUnit = null;
        
        // TODO: decide if we should replace currentSymbol with delegating
        // everything to this.value; where this would have a numerical value
        // or just be used as a variable name if empty, or an Association object.
        // which can then be used
        this.value = null;
        this.valueNegated = false;
        this.valueRepr = null;
        this.valueType = null;
        
        this.element = element;
        this.globalPointerReference = globalPointerReference;

        this.valueDisplay = element.childNodes[0];
        this.unitDisplay = element.childNodes[1];
        this.valueDisplay.dataset.status = "empty";
        this.unitDisplay.dataset.status = "empty";
        // console.log(this.name, element);
        
        // Creating the grayed out symbol representation
        this.grayOut();

        // this.element.addEventListener(
        //     "dblclick", e=> {
        //         console.log("double click",e);
        //         e.stopPropagation();
        //         this.removeValue();
        //         // TODO: INSERT DELETION logEvent here.
        //     }
        // )
        this.element.addEventListener(
            "click", e => {
                e.stopPropagation();
                //console.log(this.id)
                //MAJOR TODO: Clean up all the conditionals
                /**
                 * 1. If a value box is clicked, followed by a variable box,
                 *  a) If there is an association, we remove it and replace it with a value
                 *  b) if not, just place a value there.
                 * 2. If a variable box is clicked, and nothing before it, and it only contains a value, remove it.
                 * 3. If a variable box is clicked, and nothing before it, and it is empty, we record start of an
                 * association.
                 * 4. If a variable box is clicked,  whether or not it is empty, 
                 * and we clicked on another variable box before it, and it is not the same object, we create a
                 * 2-way association. Create this as the value for the two variable objects as well. valueType is
                 * "association".
                 * 5. If a variable box is clicked, whether or not it is empty, if 
                 * we clicked on a variable box earlier that had a value of type association,
                 * and it is not the same object, 
                 * then we add a valueType "association" to this variable as well, and add it to the association.
                 * 6. If a variable box is clicked, whether or not it is empty, if 
                 * we clicked on a variable box earlier that had a value of type association,
                 * and it IS INFACT the same object, by calling removeAssociation().
                 */
                
                if(this.valueType==null) // Box was empty
                {
                    if(this.globalPointerReference.currentClickedObject == null) // Clicked on nothing before this
                    {
                        // Start recording a possible association
                        this.globalPointerReference.currentClickedObject = this;
                        this.globalPointerReference.currentClickedObjectType = "var-box";
                        this.globalPointerReference.currentClickedObjectDescription = "started new assoc";
                        console.log("clicked first box");
                    }
                    else if(this.globalPointerReference.currentClickedObject == this) // Clicked on the same thing
                    {
                        // negate and clear context
                        this.valueNegated = !this.valueNegated;
                        if(this.valueNegated) {
                            // Then add the '-' to the beginning of the current symbol text
                            this.parentSymbol = '-'+this.parentSymbol;
                            // Render the new symbol.
                            this.grayOut();
                            // Revert it back, since we don't want it to actually show up later.
                            this.parentSymbol = this.parentSymbol.slice(1);
                        }
                        else {
                            // Don't worry about it
                            // Else, remove the first symbol only (which is the '-' symbol)
                            // this.parentSymbol = this.parentSymbol.slice(1);
                            // Render the new symbol.
                            this.grayOut();
                        }

                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                    }
                    else if(this.globalPointerReference.currentClickedObject.valueType == "association") // Clicked on an existing association
                    {
                        // "association type is always with a var-box type"
                        console.log("creating multiway association");
                        this.valueType = "association";
                        this.globalPointerReference.currentClickedObject.value.addVariable(this);
                        this.value = this.globalPointerReference.currentClickedObject.value;

                        console.log(this.globalPointerReference.currentClickedObject.id);
                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                    }
                    else if(this.globalPointerReference.currentClickedObjectDescription == "started new assoc"){
                        // Create the 2-way association and clear the global pointer
                        console.log("creating two way association");
                        this.valueType = "association";
                        this.globalPointerReference.currentClickedObject.valueType = "association";
                        this.globalPointerReference.currentClickedObject.valueNegated = false; // for now, we reset that status.
                        this.value = new Association(this.globalPointerReference.currentClickedObject, this);
                        this.globalPointerReference.currentClickedObject.value = this.value;

                        console.log(this.globalPointerReference.currentClickedObject.id);
                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                    }
                    else if(this.globalPointerReference.currentClickedObjectType == "value-box")
                    {
                        // If it's empty, or has a numerical value, just add/overwrite the values in here.
                        this.clickAddValue();
                        console.log("added value to a box");
                    }
                    else if(this.globalPointerReference.currentClickedObjectDescription == "copy number")
                    {
                        this.clickAddValue();
                        console.log("copied a number over");
                    }
                }
                else if(this.valueType=="number")
                {
                    if (this.globalPointerReference.currentClickedObject == null)
                    // If there is no other complicated context, simply the number needs to be manipulated.
                    {
                        var element = JSAV.utils.dialog(
                            "<ul><li>multiply by -1</li><li>copy</li><li>clear</li></ul>",
                            {width: 100}
                        );
                        element[0].style.top = e.pageY+5+"px"; element[0].style.left = e.pageX+10+"px";
                        element[0].childNodes[0].childNodes[0].addEventListener(
                            "click", e2=> {
                                e2.stopPropagation();
                                this.valueNegated = !this.valueNegated;
                                this.value = -1 * this.value;
                                // this.valueRepr = Window.valueTruncate(this.value);
                                this.valueRepr = Window.valueStringRepr(this.value);
                                this.setValueUnit(String(this.valueRepr), Window.unitDomainMap[this.currentUnit][1]);

                                this.globalPointerReference.currentClickedObject = null;
                                this.globalPointerReference.currentClickedObjectType = null;
                                this.globalPointerReference.currentClickedObjectDescription = null;
                                element.close();
                            }
                        );
                        element[0].childNodes[0].childNodes[1].addEventListener(
                            "click", e2=> {
                                e2.stopPropagation();
                                console.log("started copying variable");

                                this.globalPointerReference.currentClickedObject = this;
                                this.globalPointerReference.currentClickedObjectType = "var-box";
                                this.globalPointerReference.currentClickedObjectDescription = "copy number";
                                element.close();
                            }
                        )
                        element[0].childNodes[0].childNodes[2].addEventListener(
                            "click", e2=> {
                                e2.stopPropagation();
                                this.removeValue();
                                console.log("remove value from a box");

                                this.globalPointerReference.currentClickedObject = null;
                                this.globalPointerReference.currentClickedObjectType = null;
                                this.globalPointerReference.currentClickedObjectDescription = null;
                                element.close();
                            }
                        )
                    }
                    else if(this.globalPointerReference.currentClickedObject.valueType == "association")
                    {
                        this.removeValue();
                        // An existing association is involved
                        // "association type is always with a var-box type"
                        console.log("creating multiway association");
                        this.valueType = "association";
                        this.globalPointerReference.currentClickedObject.value.addVariable(this);
                        this.value = this.globalPointerReference.currentClickedObject.value;

                        console.log(this.globalPointerReference.currentClickedObject.id);
                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                    }
                    else if(this.globalPointerReference.currentClickedObjectDescription == "started new assoc")
                    {
                        this.removeValue();
                        // Create the 2-way association and clear the global pointer
                        console.log("creating two way association");
                        this.valueType = "association";
                        this.globalPointerReference.currentClickedObject.valueType = "association";
                        this.value = new Association(this.globalPointerReference.currentClickedObject, this);
                        this.globalPointerReference.currentClickedObject.value = this.value;

                        console.log(this.globalPointerReference.currentClickedObject.id);
                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                    }
                    else if(this.globalPointerReference.currentClickedObjectType == "value-box")
                    {
                        // If it's empty, or has a numerical value, just add/overwrite the values in here.
                        this.removeValue();
                        this.clickAddValue();
                        console.log("replaced a value in a box from prose");
                    }
                    else if(this.globalPointerReference.currentClickedObjectDescription == "copy number")
                    {
                        this.removeValue();
                        this.clickAddValue();
                        console.log("copied a number over");
                    }
                }
                else if(this.valueType=="association"){
                    if (this.globalPointerReference.currentClickedObject == null)
                    {
                        var element = JSAV.utils.dialog(
                            "<ul><li>multiply by -1</li><li>add new to association</li><li>clear</li></ul>",
                            {width: 120}
                        );
                        element[0].style.top = e.pageY+5+"px"; element[0].style.left = e.pageX+10+"px";
                        element[0].childNodes[0].childNodes[0].addEventListener(
                            "click", e2=> {
                                e2.stopPropagation();
                                // negate and clear context
                                this.valueNegated = !this.valueNegated;
                                if(this.valueNegated) {
                                    // Then add the '-' to the beginning of the current symbol text
                                    this.parentSymbol = '-'+this.parentSymbol;
                                    // Render the new symbol.
                                    this.grayOut();
                                    // Revert it back, since we don't want it to actually show up later.
                                    this.parentSymbol = this.parentSymbol.slice(1);
                                }
                                else {
                                    // Don't worry about it
                                    // Else, remove the first symbol only (which is the '-' symbol)
                                    // this.parentSymbol = this.parentSymbol.slice(1);
                                    // Render the new symbol.
                                    this.grayOut();
                                }

                                this.globalPointerReference.currentClickedObject = null;
                                this.globalPointerReference.currentClickedObjectType = null;
                                this.globalPointerReference.currentClickedObjectDescription = null;
                                element.close();
                            }
                        );
                        element[0].childNodes[0].childNodes[1].addEventListener(
                            "click", e2=> {
                                e2.stopPropagation();
                                // For this menu, it simply starts recording the context.
                                // Start recording a possible association
                                this.globalPointerReference.currentClickedObject = this;
                                this.globalPointerReference.currentClickedObjectType = "var-box";
                                this.globalPointerReference.currentClickedObjectDescription = "started additional assoc";
                                console.log("clicked existing assoc box");
                                element.close();
                            }
                        );
                        element[0].childNodes[0].childNodes[2].addEventListener(
                            "click", e2=> {
                                e2.stopPropagation();
                                this.value.removeAssociation(this);
                                console.log("assoc deletion");

                                this.globalPointerReference.currentClickedObject = null;
                                this.globalPointerReference.currentClickedObjectType = null;
                                this.globalPointerReference.currentClickedObjectDescription = null;
                                element.close();
                            }
                        );
                    }
                    else if(this.globalPointerReference.currentClickedObjectType == "value-box") {
                        this.value.removeAssociation(this);
                        this.clickAddValue();
                        console.log("replaced association with value from prose");
                    }
                    else if(this.globalPointerReference.currentClickedObjectDescription == "copy number") {
                        this.value.removeAssociation(this);
                        this.clickAddValue();
                        console.log("replaced association with value copied over");
                    }
                    else if(this.globalPointerReference.currentClickedObject.valueType == "association") {
                        this.value.removeAssociation(this);
                        console.log("creating multiway association");
                        this.valueType = "association";
                        this.globalPointerReference.currentClickedObject.value.addVariable(this);
                        this.value = this.globalPointerReference.currentClickedObject.value;

                        console.log(this.globalPointerReference.currentClickedObject.id);
                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                        console.log("replacing an existing association with another existing association")
                    }
                    else if(this.globalPointerReference.currentClickedObjectDescription == "started new assoc")
                    {
                        this.value.removeAssociation(this);
                        // Create the 2-way association and clear the global pointer
                        console.log("creating two way association");
                        this.valueType = "association";
                        this.globalPointerReference.currentClickedObject.valueType = "association";
                        this.value = new Association(this.globalPointerReference.currentClickedObject, this);
                        this.globalPointerReference.currentClickedObject.value = this.value;

                        console.log(this.globalPointerReference.currentClickedObject.id);
                        this.globalPointerReference.currentClickedObject = null;
                        this.globalPointerReference.currentClickedObjectType = null;
                        this.globalPointerReference.currentClickedObjectDescription = null;
                    }
                }
            }
        )
    }
    clickAddValue()
    {
        // Works just fine, no need for console.log()
        
        // domain check: to be checked later at solving stage
        // if(this.expectedDomain != this.globalPointerReference.currentClickedObject.domain
        //     && this.expectedDomain != "dimensionless"
        //     )
        // {
        //     alert("\nYou tried to put a '"+
        //     this.globalPointerReference.currentClickedObject.domain
        //     +"' type value in the box."
        //     +"\n Expected domain: "+this.expectedDomain
        //     +"\nPlease try a value of another type (the colors might help).\n\n");
        //     return;
        // }

        // console.log(this.globalPointerReference)
        // add the value
        this.value = String(this.globalPointerReference.currentClickedObject.value).slice();
        if(this.globalPointerReference.currentClickedObjectType == "value-box") {
            this.currentDomain = this.globalPointerReference.currentClickedObject.domain;
            this.currentUnit = this.globalPointerReference.currentClickedObject.unit;
        }
        else {
            this.currentDomain = this.globalPointerReference.currentClickedObject.currentDomain;
            this.currentUnit = this.globalPointerReference.currentClickedObject.currentUnit;
        }
        // this.valueRepr = Window.valueTruncate(this.value);
        this.valueRepr = Window.valueStringRepr(this.value);
        this.element.setAttribute("data-domain", this.currentDomain);
        this.valueType = "number";
        
        if(this.globalPointerReference.currentClickedObjectType == "value-box") {
            this.setValueUnit(
                // this.globalPointerReference.currentClickedObject.valueDisplay,
                this.valueRepr,
                this.globalPointerReference.currentClickedObject.unitDisplay
            )
        }
        else {
            // The innerHTML is already set, so copying it over covers what setValueUnit does.
            this.valueDisplay.dataset.status = "filled";
            this.unitDisplay.dataset.status = "filled";
            this.valueDisplay.innerHTML = this.globalPointerReference.currentClickedObject.valueDisplay.innerHTML;
            this.unitDisplay.innerHTML = this.globalPointerReference.currentClickedObject.unitDisplay.innerHTML;
        }        
        // Clear up the clicked context; the values and everything
        this.globalPointerReference.currentClickedObject = null;
        this.globalPointerReference.currentClickedObjectType = null;
        this.globalPointerReference.currentClickedObjectDescription = null;
        //console.log(this.globalPointerReference);

        // clickHandler for unit changes()
        this.unitDisplay.addEventListener("click", e=>{
            e.stopPropagation();
            this.changeUnits(e);
        });
    }
    setValueUnit(value, unit)
    {
        this.valueDisplay.innerHTML = "";
        this.unitDisplay.innerHTML = "";
        this.valueDisplay.dataset.status = "filled";
        this.unitDisplay.dataset.status = "filled";

        for(var digitindex=0; digitindex<value.split("").length; digitindex++)
        {
            this.valueDisplay.innerHTML+='<span class="mord">'+value.split("")[digitindex]+'</span>';
        }
        for(var u=0; u<unit.split("").length;
            u++)
        {
            this.unitDisplay.innerHTML+='<span class="mord mathit">'+unit.split("")[u]+'</span>';
        }
    }
    removeValue()
    {
        console.log("removed value");
        // Double click replaces the container with the empty box from before.
        // Possibly with the grayed out letters, once we've fixed that.
        this.element.setAttribute("data-domain","empty");
        this.valueDisplay.innerHTML="";
        this.unitDisplay.innerHTML="";
        this.currentDomain = null;
        this.value = null;
        this.valueType = null;

        this.unitDisplay.removeEventListener("click", this.changeUnits);
        this.valueDisplay.dataset.status = "empty";
        this.grayOut();
    }
    grayOut()
    {
        // Create a JSAV element temporarily based on the symbol, hide it;
        // copy over the katex element to the innerHTML, and save it.
        var tempElement = Window.jsavObject.label(katex.renderToString(this.parentSymbol)).hide();
        this.valueDisplay.innerHTML = tempElement.element[0].childNodes[0].childNodes[1].childNodes[2].innerHTML;
        tempElement.clear();
    }
    changeUnits(event){
        /**
         * Define list of units and standard value conversions in here
         * grouped by domain
         * UNIT_DB = {};
         */
        // Creating other units, to delegate this to a Singleton global object
        
        /**
         * Populate var text with the list of units for this domain.
         * Click handlers are associated with each element, create data-unit domains for them
         * to match with.
         */
        
        var text = "<ul>";
        // console.log(UNIT_DB[event.target.parentNode.parentNode.dataset.domain]);
        for(var x in Window.UNIT_DB[event.target.parentNode.parentNode.dataset.domain])
        {
            text+='<li data-unitname="'+x+'">'+x+' ('+
            Window.UNIT_DB[event.target.parentNode.parentNode.dataset.domain][x]['unitDisp']+')</li>';
        }
        text+="</ul>";

        var element = JSAV.utils.dialog(
             text,
            {
                width: 100
            }
        );
        Window.obj = event.target;
        element[0].style.top = event.pageY+5+"px";
        element[0].style.left = event.pageX+10+"px";
        element[0].childNodes[0].childNodes.forEach(x => {
            x.addEventListener(
                "click", e=> {
                    e.stopPropagation();
                    
                    // Change internals
                    var oldUnit = this.currentUnit;
                    this.currentUnit = Window.UNIT_DB[event.target.parentNode.parentNode.dataset.domain][x.dataset.unitname]['unit'];
                    this.value = mathjs.evaluate("number("+this.value+" "+oldUnit+", "+this.currentUnit+")")
                    // this.valueRepr = Window.valueTruncate(this.value);
                    this.valueRepr = Window.valueStringRepr(this.value);

                    // Change external views
                    this.setValueUnit(String(this.valueRepr),
                    Window.UNIT_DB[event.target.parentNode.parentNode.dataset.domain][x.dataset.unitname]['unitDisp']);
                    element.close();
                }
            )
        });
    }
}
window.Variable = window.Variable || Variable