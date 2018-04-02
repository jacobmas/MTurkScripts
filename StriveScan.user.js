
// ==UserScript==
// @name         StriveScan
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up StriveScan
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
  


    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    function validatePhone(phone) {
        var re=/[A-Za-z\-\(\)\./]*/g;
        var new_str=phone.replace(re,"");
       // console.log(new_str);
        var new_re=/^\d{3,11}/;
       // console.log(new_re.test(new_str.substr(0,10)));
        return new_re.test(new_str);
    }

    var name_paste_func=function(e,text) {
        // cancel paste
        var split_str,fname,lname;
        var appell={"mr.":0,"mrs.":0,"ms.":0,"miss":0,"dr.":0};
        if(text.indexOf(",") !== -1)
        {
         //   console.log("Found comma");
            split_str=text.split(/,\s*/);
            if(split_str.length >= 3 && split_str[0].toLowerCase() in appell) {
                fname=split_str[1].trim();
                lname=split_str[2].trim();
            }
            else
            {

                if(split_str.length > 0) lname=split_str[0].trim();
                if(split_str.length > 1) fname=split_str[1].trim();
            }
        }
        else {


            split_str=text.split(/\s+/);
         //    console.log("split_str.length="+split_str.length);
            if(split_str.length >= 3)
            {
                if(split_str[0].toLowerCase() in appell)
                {

                    fname=split_str[1].trim();
                    lname=split_str[2].trim();
                }
                else
                {

                    fname=split_str[0].trim();
                    lname=split_str[1].trim();
                }
               // console.log("split_str[0]="+split_str[0]);
            }
            else
            {

                if(split_str.length > 0) fname=split_str[0].trim();
                if(split_str.length > 1) lname=split_str[1].trim();
            }
        }
        var id_val=e.target.id.substr(0,2);
        document.getElementById(id_val+"AfirstName").value=fname;
        document.getElementById(id_val+"BlastName").value=lname;

    };

    function paste_webpage(e)
    {
       e.preventDefault();
        // get text representation of clipboard
       var text = e.clipboardData.getData("text/plain");
       var total=document.getElementById("00Counselors").value;
        var num=0;
        if(total.length>0)
        {
            num=parseInt(total);
        }
        var i;
        var curr_id;
        for(i=1; i <= num; i++)
        {
           curr_id=(i).toString();
            if(i < 10) curr_id="0"+curr_id;
            curr_id=curr_id+"Furl";
            document.getElementById(curr_id).value=text;
        }
    }

    var data_paste_func=function(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_lines=text.split(/\n|\t|–|( - )/);
        var fname="",lname="";
        var i=0,j=0;
        var curr_line, second_part_line, second_arr;
        var has_pasted_title=false;
        var id_val=e.target.id.substr(0,2);
        if(split_lines===null)
            return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j].trim().length > 0)
                break;
        }
        if(split_lines.length>0 && j<split_lines.length&& split_lines[j].trim().length > 0)
        {
        //    console.log("Hello");
            name_paste_func(e,split_lines[j]);
        }
        for(i=j+1; i < split_lines.length; i++)
        {
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            second_part_line=second_arr[second_arr.length-1].trim();
            if(validateEmail(second_part_line))
            {
                document.getElementById(id_val+"Demail").value=second_part_line;
            }
            else if(validatePhone(second_part_line)
                     )
            {
                document.getElementById(id_val+"Ephone").value=second_part_line;
            }
            else if(second_part_line.length>10 &&
                    second_part_line.substr(0,10)==="Phone Icon" && validatePhone(second_part_line.substr(11)))
            {
                document.getElementById(id_val+"Ephone").value=second_part_line.substr(11);
            }
            else if(second_part_line.trim().length>0 && second_part_line.indexOf("Title:")===-1 && !has_pasted_title)
            {
                has_pasted_title=true;
                document.getElementById(id_val+"Ctitle").value=second_part_line.trim();
            }
            else
            {
                console.log("curr_line="+curr_line);
            }
        }

    };



  

    var i;
    var inst_body=document.getElementById("instructionBody");
    var p=inst_body.getElementsByClassName("p");
    //inst_body.removeChild(p[1]);
    inst_body.removeChild(inst_body.firstChild);
    inst_body.removeChild(inst_body.firstChild);
    inst_body.removeChild(inst_body.firstChild);
    inst_body.removeChild(inst_body.firstChild.nextSibling);
    inst_body.removeChild(inst_body.firstChild.nextSibling);
    inst_body.removeChild(inst_body.firstChild.nextSibling);
    inst_body.removeChild(inst_body.firstChild.nextSibling);
    //inst_body.removeChild(inst_body.getElementsByClassName("ol")[0]);
    for(i=1; i<=20; i++) {
  //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
        var curr_id=(i).toString();
        if(i < 10) curr_id="0"+curr_id;
        curr_id=curr_id+"AfirstName";
        if(document.getElementById(curr_id) !== null)
        {
            document.getElementById(curr_id).addEventListener("paste",data_paste_func);
            //document.getElementById("fname_"+i).addEventListener("paste", function(e) {
                //console.log("window.clipboardData="+window.clipboardData);
              //  column_paste_func(e); } );
           // console.log("MOO, i="+i);

        }

    }
    document.getElementById("01Furl").addEventListener("paste", paste_webpage);


})();