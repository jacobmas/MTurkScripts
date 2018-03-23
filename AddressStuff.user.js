// ==UserScript==
// @name         AddressStuff
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Karen Veltri tasks by allowing efficient copy/paste from Linkedin with Linkedinscript
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include file://*
// @grant        GM_setClipboard
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==

(function() {
    'use strict';
    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
     function validatePhone(phone) {
        var re=/[\-\(\)\s\./]*/g;
        var new_str=phone.replace(re,"");
       // console.log(new_str);
        var new_re=/^\d{7,11}/;
       // console.log(new_re.test(new_str.substr(0,10)));
        return new_re.test(new_str);
    }
    function matchPhone(phone) {
        var re=/(?\d{3}[\d\-\(\)\s\./]*\d{4}/;
        var replace_re=/[\-\(\)\s\./]*/g;

        var result=phone.match(re);
        if(result !== null && result.length>0)
        {
            return result;
        }
        return null;
       /* var new_str=phone.replace(re,"");
       // console.log(new_str);
        var new_re=/^\d{7,11}/;
       // console.log(new_re.test(new_str.substr(0,10)));
        return new_re.test(new_str);*/
    }

    function paste_office(text, add_num)
    {
        var first_ind;
        first_ind=text.indexOf("\n");
        if(first_ind !== -1)
        {
            document.getElementsByName("officeName")[add_num].value=text.substring(0,first_ind);
            paste_address(text.substring(first_ind+1),add_num);
        }
        else
        {
            document.getElementsByName("officeName")[add_num].value=text;
        }
    }
    function paste_city(text, add_num)
    {
        var re=/([A-Za-z0-9\s]+)\s*,\s*([A-Za-z\s]+)\s*([\d\-]+)/;
        var result = re.exec(text);
        if(result !== null)
        {
           document.getElementsByName("city")[add_num].value=result[1];
            document.getElementsByName("state")[add_num].value=result[2];
            document.getElementsByName("country")[add_num].value="US";
            document.getElementsByName("zip")[add_num].value=result[3];
        }
        else
        {
            document.getElementsByName("city")[add_num].value=text;
        }
    }


    function paste_address(text, add_num)
    {
        // cancel paste
        //e.preventDefault();
        // get text representation of clipboard
        //var text = e.clipboardData.getData("text/plain");

        console.log("text="+text+"\nadd_num="+add_num);

        var split_text=text.split("\n");
        var i;
        var is_fax=false;
        for(i=0; i < split_text.length; i++)
        {
            var possible_phone="";
            if(split_text[i].indexOf(":")!==-1)
            {
                possible_phone=split_text[i].split(":")[1].trim();
            }
            else
            {
                possible_phone=split_text[i].trim();
            }
            console.log("possible_phone="+possible_phone+"\tvalidation="+validatePhone(possible_phone));
            if(validatePhone(possible_phone))
            {
                if(!is_fax)
                {
                    document.getElementsByName("phoneNumber")[add_num].value=possible_phone;
                    is_fax=true;
                }
                else
                {
                    document.getElementsByName("faxNumber")[add_num].value=possible_phone;
                }
            }
            else if(validateEmail(possible_phone))
            {
                document.getElementsByName("email")[add_num].value=possible_phone;
                text=text.replace(possible_phone,"");
            }


        }


        var parsed = parseAddress.parseLocation(text);
        var add1Str=""+parsed.number;
        if(parsed.prefix !== undefined) add1Str=add1Str+" "+parsed.prefix;
        if(parsed.street !== undefined) add1Str=add1Str+" "+parsed.street;
        if(parsed.type !== undefined) add1Str=add1Str+" " + parsed.type;
        if(parsed.suffix !== undefined) add1Str=add1Str+" "+parsed.suffix;

        document.getElementsByName("addressLine1")[add_num].value=add1Str;
        if(parsed.sec_unit_type !== undefined) {
            document.getElementsByName("addressLine2")[add_num].value=parsed.sec_unit_type+" "+parsed.sec_unit_num;
        }
        else
        {
            document.getElementsByName("addressLine2")[add_num].value="";
        }
        document.getElementsByName("city")[add_num].value=parsed.city;
        document.getElementsByName("state")[add_num].value=parsed.state;
        document.getElementsByName("country")[add_num].value="US";
        document.getElementsByName("zip")[add_num].value=parsed.zip;
        console.log(JSON.stringify(parsed));

    }





    var well=document.getElementsByClassName("well")[0];
    var wellparent=well.parentNode;
  /*  var button = document.createElement("input");
    button.type="button";
    button.value="Load Address";
        button.style.margin='5px';
    button.style.marginRight='20px';
    wellparent.insertBefore(button, well.nextSibling);*/
    var btnAdd=document.getElementById("btnAdd");

    var i;
    var addLines1=document.getElementsByName("addressLine1");
    var officeName=document.getElementsByName("officeName");
    var city = document.getElementsByName("city");
    console.log(addLines1.length);
    for(i=0; i < addLines1.length; i++)
    {
        addLines1[i].onpaste=function(e) {
            e.preventDefault();
            var text=e.clipboardData.getData("text/plain");
            paste_address(text,i-1);
        };
        officeName[i].onpaste=function(e) {
                e.preventDefault();
                var text=e.clipboardData.getData("text/plain");
                paste_office(text,i-1);
            };
        city[i].onpaste=function(e) {
                e.preventDefault();
                var text=e.clipboardData.getData("text/plain");
                paste_city(text,i-1);
            };
    }

    btnAdd.addEventListener("click", function() {
        var i;
        var addLines1=document.getElementsByName("addressLine1");
        var officeName=document.getElementsByName("officeName");
        var city = document.getElementsByName("city");
        console.log(addLines1.length);
        for(i=0; i < addLines1.length; i++)
        {
            addLines1[i].onpaste=function(e) {
                e.preventDefault();
                var text=e.clipboardData.getData("text/plain");
                paste_address(text,i-1);
            };
            officeName[i].onpaste=function(e) {
                e.preventDefault();
                var text=e.clipboardData.getData("text/plain");
                paste_office(text,i-1);
            };
            city[i].onpaste=function(e) {
                e.preventDefault();
                var text=e.clipboardData.getData("text/plain");
                paste_city(text,i-1);
            };
        }

    });



})();