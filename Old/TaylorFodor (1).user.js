// ==UserScript==
// @name         TaylorFodor

// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=false;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?([0-9]{3})?[)]?[-\s\.\/]?[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function bad_email_url(to_check)
    {
        let i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(to_check.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }

    function check_and_submit()
    {

        console.log("Checking and submitting");
   
        if(automate)
                setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
    }
    function is_bad_url(the_url)
    {
        var i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(the_url.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }
    function coach_response(response) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var the_tables=doc.getElementsByTagName("table");
        var s, a, i, j, r, c, l = doc.getElementsByClassName("__cf_email__");
        for(i=0; i < l.length; i++)
        {
            a = l[i].dataset.cfemail;
            if (a) {
                s = '';
                r = parseInt(a.substr(0, 2), 16);
                for (j = 2; a.length - j; j += 2) {
                    c = parseInt(a.substr(j, 2), 16) ^ r;
                    s += String.fromCharCode(c);
                }
                console.log("s="+s);

                l[i].dataset.cfemail=s;
                l[i].innerText=s;
                l[i].href="mailto:"+s;
            }
        }
        console.log("In coach response, the_tables.length="+the_tables.length);

        for(i=0; i < the_tables.length; i++)
        {
            parse_table(the_tables[i]);
        }
        check_and_submit();
    }

    function parse_table(the_table)
    {
        console.log("Begin table parse\n");
        var column_map={};
        var t_head, curr_row;
        var normal_length=0;
        var i,j;
        var curr_name;
        var good_table=false;
        if(the_table.rows.length==0) return;
        t_head=the_table.rows[0];
        if(the_table.previousSibling!==null)
        {
            console.log("\tthe_table.previousSibling="+the_table.previousSibling);
            console.log("\tthe_table.previousSibling.previousSibling="+the_table.previousSibling.previousSibling);
            console.log("\tcheck="+(the_table.previousSibling.previousSibling instanceof HTMLHeadingElement ||
                                   the_table.previousSibling.previousSibling instanceof HTMLElement));
        }
        if(the_table.previousSibling!==null && (the_table.previousSibling.previousSibling instanceof HTMLHeadingElement ||
                                   the_table.previousSibling.previousSibling instanceof HTMLElement))
        {
            //console.log("the_table.previousSibling.previousSibling.innerText="+the_table.previousSibling.previousSibling.innerText);
        }
        if(the_table.previousSibling !== null && the_table.previousSibling.previousSibling !== null &&
          (the_table.previousSibling.previousSibling instanceof HTMLHeadingElement ||
                                   the_table.previousSibling.previousSibling instanceof HTMLElement) &&
          the_table.previousSibling.previousSibling.innerText.indexOf(my_query.sport_name)!==-1  &&

           the_table.previousSibling.previousSibling.innerText.toLowerCase().indexOf("keyword search")===-1
          )
        {
            console.log("FOUND GOOD TABLE for "+my_query.sport_name+"!!!!!\n\n");
            good_table=true;
            //console.log("\tthe_table.previousSibling.previousSibling.innerText="+the_table.previousSibling.previousSibling.innerText+"\n\n");
        }
        normal_length=t_head.cells.length;
        console.log("normal_length="+normal_length);
        for(i=0; i < t_head.cells.length; i++)
        {
            //console.log("t_head.cells["+i+"].innerText="+t_head.cells[i].innerText);
            let curr_cell=t_head.cells[i].innerText.toLowerCase();
            if(curr_cell.indexOf("name")!==-1)
            {
                console.log("Found name at "+i);
                column_map.name=i;
            }
            else if(curr_cell.indexOf("title")!==-1 || curr_cell.indexOf("position")!==-1)
            {
              //  console.log("Found title at "+i);

                column_map.title=i;
            }
            else if(curr_cell.indexOf("mail")!==-1)
            {
                console.log("Found mail at "+i);
                column_map.mail=i;
            }
            else if(curr_cell.indexOf("phone")!==-1)
            {
                console.log("Found phone at "+i);
                column_map.phone=i;
            }
            else if(curr_cell.indexOf("first")!==-1)
            {
                column_map.first_name=i;
            }
            else if(curr_cell.indexOf("last")!==-1)
            {
                column_map.last_name=i;
            }
        }
        console.log("End of loop");
        if(column_map.title===undefined)
        {

            console.log("no title in column_map");
            if(the_table.rows.length<=1)
            {
                console.log("the_table.rows.length="+the_table.rows.length);
                return;
            }
            else if(normal_length===1 && the_table.rows[1].cells.length>1)
            {
                normal_length=the_table.rows[1].cells.length;
                console.log("new normal length="+normal_length);
                /* Check for phone # */
                for(i=0; i < the_table.rows[1].cells.length; i++)
                {
                    // console.log("t_head.cells["+i+"].innerText="+t_head.cells[i].innerText);
                    let curr_cell=the_table.rows[1].cells[i].innerText.toLowerCase();
                    if(email_re.test(curr_cell) || curr_cell.indexOf("mail")!==-1)
                    {
                        console.log("Found mail at "+i);
                        column_map.mail=i;
                    }
                    else if(phone_re.test(curr_cell) || curr_cell.indexOf("phone")!==-1)
                    {
                        console.log("Found phone at "+i);
                        column_map.phone=i;
                    }
                    else if(i===1 || curr_cell.indexOf("title")!==-1)
                    {
                        column_map.title=i;
                    }
                    else if(i===0 || curr_cell.indexOf("name")!==-1)
                    {
                        column_map.name=i;
                    }

                }
                console.log("Guessed column_map="+JSON.stringify(column_map));
            }
            else
            {
                console.log("rows[1].cell[0].innerText="+the_table.rows[1].cells[0].innerText+", rows[1].cells.length="+the_table.rows[1].cells.length);
                if(the_table.rows[1].cells[0].innerText.indexOf("Filter by")===-1)
                {
                    console.log("No longer returning");
                    column_map.title=1;
                    column_map.name=0;
                    column_map.phone=3;
                    column_map.mail=2;
                }
                else
                {
                    console.log("Returning");
                    return;
                }
            //return
//                return;
            }


        }
        else
        {
            console.log("title is in column_map");
        }
        for(i=1; i < the_table.rows.length; i++)
        {


            curr_row=the_table.rows[i];
            console.log("i="+i+", good_table="+good_table);
            try
            {
                good_table=parse_in_row(curr_row, normal_length, good_table, column_map);
            }
            catch(error)
            {
                console.log("Error encountered, continuing");
                break;
            }
        }

    }
    function parse_in_row(curr_row, normal_length, good_table, column_map)
    {
        var curr_name;

        //curr_row=the_table.rows[i];
        /*console.log("curr_row.className="+curr_row.className);
        console.log("curr_row.cells.length="+curr_row.cells.length); */
        console.log("curr_row.cells[0].colspan="+curr_row.cells[0].colspan+", curr_row.cells[0].innerText="+curr_row.cells[0].innerText+"\n");
/*        console.log("curr_row.cells[0].getOwnPropertyNames()="+JSON.stringify(curr_row.cells[0].attributes));*/
        if(curr_row.cells.length < normal_length || (curr_row.cells[0].colspan!==undefined))
        {
            if(curr_row.cells.length>0 && curr_row.cells[0].innerText.indexOf(my_query.sport_name)!==-1)
            {
                console.log("Problem row good: "+curr_row.cells[0].innerText);

                good_table=true;
            }
            else
            {
                console.log("Problem row bad: "+curr_row.cells[0].innerText);
                good_table=false;
            }
            return good_table;
        }
        if(
            my_query.pos_count <= 10 &&
            (curr_row.cells[column_map.title].innerText.indexOf(my_query.sport_name)!==-1 || good_table))
        {
            console.log("Good: curr_row.cells[column_map.title]="+curr_row.cells[column_map.title]);
            /* Found a good row */
            document.getElementById("Job Title (Coach #"+my_query.pos_count+")").value=curr_row.cells[column_map.title].innerText.trim();
            if(column_map.name!==undefined)
            {
                console.log("Found name in row");
                curr_name = parse_name(curr_row.cells[column_map.name].innerText.trim());
                console.log(curr_name);
                document.getElementById("First Name (Coach #"+my_query.pos_count+")").value=curr_name.fname;
                document.getElementById("Last Name (Coach #"+my_query.pos_count+")").value=curr_name.lname;
            }
            if(column_map.first_name!==undefined)
            {
                document.getElementById("First Name (Coach #"+my_query.pos_count+")").value=curr_row.cells[column_map.first_name].innerText.trim();
            }
            if(column_map.last_name!==undefined)
            {
                document.getElementById("Last Name (Coach #"+my_query.pos_count+")").value=curr_row.cells[column_map.last_name].innerText.trim();
            }

            if(column_map.mail !== undefined)
            {
                var inner_a=curr_row.cells[column_map.mail].getElementsByTagName("a");
                if(inner_a!==null && inner_a!==undefined && inner_a.length>0 && inner_a[0].innerText.indexOf("@")===-1)
                {

                    console.log(inner_a[0].parentNode.innerHTML);
                    document.getElementById("Email Address (Coach #"+my_query.pos_count+")").value=inner_a[0].href.replace(/^mailto:/,"");
                }
                else
                {
                    document.getElementById("Email Address (Coach #"+my_query.pos_count+")").value=curr_row.cells[column_map.mail].innerText.trim();
                }
            }
            if(column_map.phone !== undefined)
            {
                document.getElementById("Phone Number (Coach #"+my_query.pos_count+")").value=curr_row.cells[column_map.phone].innerText.trim();
            }
            my_query.pos_count=my_query.pos_count+1;

        }
        else
        {
            //console.log("Bad: curr_row.cells[column_map.title]="+curr_row.cells[column_map.title]);
        }
        return good_table;

    }
    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++)
            if(to_check.indexOf(prefixes[j])===0) return true;
        return false;
    }
    function parse_name(to_parse)
    {
        var suffixes=["Jr","II","III","IV","CPA","CGM"];
        var prefixes=["Dr."];
        var split_parse=to_parse.split(" ");
        var last_pos=split_parse.length-1;
        var j;
        var caps_regex=/^[A-Z]+$/;
        var apostrophe_regex=/^\'/;
        var ret={fname:"",lname:""};
        for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
        {
            if(!prefix_in_string(suffixes,split_parse[last_pos]) && !caps_regex.test(split_parse[last_pos]) &&
              !apostrophe_regex.test(split_parse[last_pos])) break;

        }
        ret.lname=split_parse[last_pos];
        ret.fname=split_parse[0];
        if(last_pos>=2 && split_parse[1].length>=1)
            ret.mname=split_parse[1].substring(0,1);
        else
            ret.mname="";
        return ret;

    }
    function data_paste(e) {
        // cancel paste
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");
        var split_str=text.trim().split("\n");
        var i;
        var split_line;
        var name, title, phone, email;
        var counter=0;
        var email_column=2;
        var phone_column=3;
        var name_column=0;
        var title_column=1;
        var email_phone;
        var tested_email=false, tested_phone=false;

        var j;
        var pasted_something=false;
        var photo_re = /Photo$/;
        for(i=0; i < split_str.length; i++)
        {
            console.log("split_str["+counter+"]="+split_str[counter]);
            if(counter>=10) break;
            split_line=split_str[counter].trim().split("\t");
            console.log("split_line="+JSON.stringify(split_line));
            if(split_line.length<4)
            {
                continue;
            }

            if((split_line.length>1 && split_line[0]===split_line[1]) ||  photo_re.test(split_line[0]))
            {
                name_column=1;
                title_column=2;
            }
            for(j=0; j < split_line.length; j++)
            {

                if(email_re.test(split_line[j]) && !tested_email) {
                    email_column=j;
                    tested_email=true;
                }
                if(phone_re.test(split_line[j])) {

                    phone_column=j;
                    tested_phone=true;
                }
            }
            name=parse_name(split_line[name_column]);
            pasted_something=true;
            document.getElementById("First Name (Coach #"+(counter+1)+")").value=name.fname;
            document.getElementById("Last Name (Coach #"+(counter+1)+")").value=name.lname;
            document.getElementById("Job Title (Coach #"+(counter+1)+")").value=split_line[title_column];
            document.getElementById("Email Address (Coach #"+(counter+1)+")").value=split_line[email_column];
            document.getElementById("Phone Number (Coach #"+(counter+1)+")").value=split_line[phone_column];
            counter++;


        }
        try
        {
            counter=0;
            if(!pasted_something)
            {
                for(i=0; i < split_str.length; i+=3)
                {
                    for(j=0; j < 3; j++)
                    {
                        console.log("split_str["+i+j+"]="+split_str[i+j]);
                    }
                    name=parse_name(split_str[i]);
                    email_phone=split_str[i+2].split(/\s/);
                    console.log("email_phone.length="+email_phone.length);
                    document.getElementById("First Name (Coach #"+(counter+1)+")").value=name.fname;
                    document.getElementById("Last Name (Coach #"+(counter+1)+")").value=name.lname;
                    document.getElementById("Job Title (Coach #"+(counter+1)+")").value=split_str[i+1];
                    for(j=0; j < email_phone.length; j++)
                    {
                        if(email_re.test(email_phone[j]))
                            document.getElementById("Email Address (Coach #"+(counter+1)+")").value=email_phone[j];
                        if(phone_re.test(email_phone[j]))
                            document.getElementById("Phone Number (Coach #"+(counter+1)+")").value=email_phone[j];
                    }
                    counter++;
                    if(counter>=10) break;

                }
            }
        }
        catch(error)
        {
            console.log("Error in second try parse="+error);
        }
    }
    function init_TaylorFodor()
    {
        var anchors=document.getElementsByClassName("dont-break-out");
        var url=anchors[0].href.replace(/^www/,"http://www");
        var sport_name=anchors[1].textContent;//.split(" "),sport_name,gender;
        sport_name=sport_name.replace("Women's Volleyball","Volleyball");
        var split_sport=sport_name.split(" "),short_sport_name,bad_sport_name;
        var first_field=document.getElementById("First Name (Coach #1)");
        first_field.addEventListener("paste", data_paste);
        if(split_sport.length==2)
        {
            short_sport_name=split_sport[1];
            if(split_sport[0]=="Men's")
            {
                bad_sport_name="Women's "+split_sport[1];
            }
            else
            {
                bad_sport_name="Men's "+split_sport[1];
            }
        }
//        console.log
        /*if(full_sport_name.length==1)
        {
            sport_name=anchors[1].textContent;
            gender="";
        }
        else
        {
            sport_name=anchors[1].textContent.split(" ")[1];
            gender=anchors[1].textContent.split(" ")[0];
        }*/
        my_query={url: url, sport_name: sport_name, pos_count: 1, short_sport_name: short_sport_name, bad_sport_name: bad_sport_name};
        GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             coach_response(response);
            },
            onerror: function(response) { console.log("Failed to load");
                                        GM_setValue("returnHit",true);

                                        },
            ontimeout: function(response) { console.log("Failed to load");
                                          GM_setValue("returnHit",true);
                                          }


        });




     





    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") != -1 || window.location.href.indexOf("amazonaws.com") != -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_TaylorFodor();
        }

    }
    else
    {
       // console.log("In LuisQuintero main");
        if(automate)
            setTimeout(function() { btns_secondary[0].click(); }, 15000);
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate)
                        setTimeout(function() { btns_secondary[0].click(); }, 0);
                }
            });
         /* Regular window at mturk */
        var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
               btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(automate)
                btns_primary[0].click();
        }
        else
        {
            /* Wait to return the hit */
            console.log("MOO");
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();