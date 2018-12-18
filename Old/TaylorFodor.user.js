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
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/([(]?[0-9]{3}[)]?[-\s\.\/]+)?[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var new_phone_re=/Phone: ([(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["facebook.com","instagram.com","twitter.com","yelp.com","webnode.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var sport_map1={
        "Field Hockey":["fhockey","fhock"],
        "Football":["football"],
        "Men's Basketball":["mbball"],
        "Men's Soccer":["msoc"],
        "Men's Swimming": ["mswim","swim","msd"],
        "Men's Water Polo": ["mwpolo"],
        "Women's Basketball":["wbball"],
        "Women's Soccer":["wsoc"],
        "Women's Swimming":["wswim","swim","wsd"],
        "Women's Volleyball":["wvball","vball","volleyball"],
        "Wrestling":["wrestling"],
    "Men's Wrestling":["wrestling"]};
    var sport_map1a={"Field Hockey":"fhock"};
    var sport_map2={"Men's Basketball":["mbkb","m-baskbl"],
                    "Men's Soccer":["msoc","m-soccer"],
                    "Football":["fball","m-footbl"],
                    "Women's Basketball":["wbkb","w-baskbl"],
                    "Women's Volleyball":["wvball","w-volley"],
                    "Men's Swimming":["mswimdive","mswim","swim","swimdive","m-swim"],
                    "Men's Water Polo": ["mwaterpolo"],

                    "Women's Swimming":["wswim","wswimdive","swim","swimdive","w-swim"],
                    "Field Hockey":["fh"],
                    "Women's Soccer":["wsoc","w-soccer"],
                   "Men's Wrestling":["wrest"]
                   };
    var first_try=true;

    function hex_at(str, index) {
        var r = str.substr(index, 2);
        return parseInt(r, 16);
    }
    function decryptCloudFlare(ciphertext) {
        var output = "";
        var key = hex_at(ciphertext, 0);
        for(var i = 2; i < ciphertext.length; i += 2) {
            var plaintext = hex_at(ciphertext, i) ^ key;
            output += String.fromCharCode(plaintext);
        }
        output = decodeURIComponent(escape(output));
        return output;
    }

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
      
           if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
        }
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


    function validateEmail(email) {
    //    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return email_re.test(String(email).toLowerCase());
    }
    function validatePhone(phone) {
        var re=/[A-Za-z\-\(\)\./]*/g;
        var new_str=phone.replace(re,"");
       // console.log(new_str);
        var new_re=/^\d{3,11}/;
       // console.log(new_re.test(new_str.substr(0,10)));
        return new_re.test(new_str);
    }

    function name_paste_func(text,id_val) {
        // cancel paste
        console.log("text="+text);
        var to_flip=document.getElementById("flipped_true").checked;

        document.getElementById("TeacherName"+id_val).value=parse_name_func(text);
    }
    function parse_name_func(text)
    {
        var split_str,fname,lname;
        var appell=[/^Mr.\s*/,/^Mrs.\s*/,/^Ms.\s*/,/^Miss\s*/,/^Dr.\s*/];

        var i;
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        text=text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");

        return text;
    }
    function strip_null_blank(str_array)
    {
        var ret_array=[];
        for(var i=0; i < str_array.length; i++)
        {
            var curr_str=str_array[i];
            if(curr_str!==null && curr_str!==undefined && curr_str.length>0 && curr_str.indexOf(".jpg")===-1) ret_array.push(curr_str.replace(/^([^:]*:)/,""));
        }
        return ret_array;
    }
    function do_data_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var id=e.target.name;
        console.log("id="+id);
        var id_val=id.match(/[\d]+/)[0];
        console.log("id_val="+id_val);
        var id_int=parseInt(id_val);

        var i,j;
        if(document.getElementById("mult_rows").checked)
        {
            var split_str_temp=strip_null_blank(text.split(/\s*\n\s*/)),split_str=[];
            console.log("do_data_paste: split_str_temp="+split_str_temp);
            var curr_str="";
            var lines_row=parseInt(document.getElementById("lines_row_select").value);
            console.log("lines_row="+lines_row);
            for(i=0; i < split_str_temp.length; i+= lines_row)
            {
                curr_str="";
                for(j=0; j < lines_row; j++)
                {
                    if(j>0) curr_str=curr_str+"\t";
                    curr_str=curr_str+split_str_temp[i+j];
                }
                split_str.push(curr_str);
            }
            console.log("split_str="+split_str);
            for(i=0; i < split_str.length && i < 20; i++)
            {
                if(split_str[i]!==null && split_str[i]!==undefined && split_str[i].length>0)
                {
                    console.log("do_data_paste: split_str["+i+"]="+split_str[i]);
                    if(data_paste_func(split_str[i],id_int))
                        id_int=id_int+1;
                }
            }

        }
        else
        {
            console.log("id_val="+id_val);
            data_paste_func(text,id_val);
        }
    }
    function setField(field, id,value)
    {
        if(value===undefined) return;
        if(/phone/i.test(field) && (/x/.test(value) || /ext:/i.test(value)) && my_query.phone.length>0)
        {
            value=my_query.phone+" "+value;
        }
        if(/phone/i.test(field) && phone_re.test(value))
        {
            value=value.match(phone_re)[0];
        }
        if(/email/i.test(field) && !email_re.test(value)) value="";
        var nameVal=field+" (Coach #"+id+")";
        console.log("Setting field "+nameVal+" with "+value);
        document.getElementsByName(field+" (Coach #"+id+")")[0].value=value;
    }

    function data_paste_func(text, id_val) {
        // cancel paste
        //e.preventDefault();
        // get text representation of clipboard
       // var text = e.clipboardData.getData("text/plain");
        console.log("IN data paste");
        var fname="",lname="";
        var i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false;
        var ret=parse_data_func(text);
        console.log("Parse name last");
        var fullname=parse_name(ret.name);
        console.log("id_val="+id_val);
        setField("First Name",id_val,fullname.fname);
        setField("Last Name",id_val,fullname.lname);
        setField("Job Title",id_val,ret.title);
        setField("Email Address",id_val,ret.email);
        setField("Phone Number",id_val,ret.phone);

        return true;


    }

    function add_fields(ret, id_val)
    {
        if(id_val<1 || id_val > 10) return;
        var fullname=parse_name(ret.name.trim());
        console.log("id_val="+id_val);
        setField("First Name",id_val,fullname.fname);
        setField("Last Name",id_val,fullname.lname);
        setField("Job Title",id_val,ret.title);
        setField("Email Address",id_val,ret.email);
        setField("Phone Number",id_val,ret.phone);
    }

    function substring_in_strings(strings, to_check)
    {
        var j;
        for(j=0; j < strings.length; j++) {
           // console.log("to_check=\""+to_check+"\", strings["+j+"]=\""+strings[j]+"\"");
            if(to_check.toLowerCase().indexOf(strings[j].toLowerCase())!==-1) return true;
        }
        return false;
    }

    function parse_data_func(text)
    {
        var ret={name:"",email:"",subject:""};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false, found_phone=false;

        var to_flip=document.getElementById("flipped_true").checked;
        for(i=0; i < split_lines_1.length; i++)
        {
            if(split_lines_1[i]!==undefined && split_lines_1[i]!==null)
            {
                /* Check if commas need to be split out */
                var new_split;
                if(i===0 && /^[^\s]+\s+[^\s]+,/.test(split_lines_1[i]))
                {
                    /* It's not a Last, First situation */
                    new_split=split_lines_1[i].split(",");
                    for(j=0; j < new_split.length; j++) split_lines.push(new_split[j].trim());
                }
                else
                {
                    split_lines.push(split_lines_1[i]);
                }
            }
        }


        console.log("parse_data_func: "+JSON.stringify(split_lines));

        var good_stuff_re=/[A-Za-z0-9]/;

        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j]!==null
               && split_lines[j]!==undefined && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j])) break;
        }
        var split_comma=split_lines[j].split(/,/);
        var counselor_re=/Counselor/i;
        if(split_comma.length===2 && (counselor_re.test(split_comma[1]) | /[^\s]\s/.test(split_comma[0])))
        {
            var curr_last=split_lines.length-1
            split_lines.push(split_lines[curr_last]);
            for(k=curr_last; k>=j+2; k--)
            {
                split_lines[k]=split_lines[k-1];
            }
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }

        if(split_lines.length>0 && j<split_lines.length&& split_lines[j]!==null &&split_lines[j]!==undefined && split_lines[j].trim().length > 0)
        {
        //    console.log("Hello");
            var begin_name=split_lines[j].trim();
            if(!/\s/.test(begin_name) && j+1 < split_lines.length)
            {
                if(to_flip) begin_name=split_lines[j+1]+" "+begin_name;
                else begin_name=begin_name+" "+split_lines[j+1];
                j=j+1;
            }
            ret.name=parse_name_func(begin_name);
        }
        console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
            found_email=false;
            found_phone=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
            console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            second_part_line=second_arr[second_arr.length-1].trim();
            console.log("second_part_line="+second_part_line);
            if(email_re.test(second_part_line))
            {
                found_email=true;
                console.log("Matched email");
                ret.email=second_part_line.match(email_re)[0];
            }
            else if(phone_re.test(second_part_line))
            {
                found_phone=true;
                console.log("Matched phone");
                ret.phone=second_part_line.match(phone_re)[0];
            }
            if(!found_email && !found_phone && second_part_line.trim().length>0 && second_part_line.indexOf("Title:")===-1 && !has_pasted_title
                   )
            {
                has_pasted_title=true;
                ret.title=second_part_line.trim();
            }
            else
            {
                console.log("curr_line="+curr_line);
            }
        }
        return ret;
    }


    function replace_strings(toReplace, replaceMap)
    {
        var x;
        for(x in replaceMap)
        {
            toReplace=toReplace.replace(x, replaceMap[x]);
        }
        return toReplace;
    }


    function is_sport_index(url, additional)
    {
        var the_sports=sport_map2[my_query.sport];
        if(the_sports===undefined) return false;
      //  console.log("additional="+additional.length);
        var i;
        for(i=0; i < the_sports.length; i++)
        {

         //   console.log("Here url="+url+"\t"+the_sports[i]);
            if((additional!==undefined && additional.length>0 && url.indexOf("/sports/"+the_sports[i]+"/"+additional+"/index")!==-1) ||
               ((additional===undefined || additional.length===0) && url.indexOf("/sports/"+the_sports[i]+"/index")!==-1))
            {

                return true;
            }
        }
        //        console.log("url="+url+", "+"/sports/"+the_sports[i]+"/index"+" returning false");

        return false;
    }




    function sports_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j,k;
        my_query.phone="";
        var phone_match=doc.body.innerText.match(new_phone_re);
        if(phone_match!==null)
        {
            my_query.phone=phone_match[1];
        }
        var cf_email=doc.getElementsByClassName("__cf_email__");
        for(i=0; i < cf_email.length; i++)
        {
            cf_email[i].innerText=decryptCloudFlare(cf_email[i].dataset.cfemail);
        }
        console.log("in sports_response, url="+response.finalUrl);
//        for(var i in response) console.log("i="+i+", "+response[i]);
      if(response.finalUrl.indexOf("sorry.ashx")!==-1 && !my_query.doneSorry)
      {
          my_query.doneSorry=true;
           GM_xmlhttpRequest({
                    method: 'GET',
                    url:    response.finalUrl.replace("sorry.ashx","staff.aspx"),

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        sports_response(response, resolve, reject);
                    },
                    onerror: function(response) { console.log("Fail with "+new_url); },
                    ontimeout: function(response) { console.log("Fail with "+new_url); }
                });
          return;
      }

        var url=response.finalUrl;
        var begin_url=response.finalUrl.replace(/(https?:\/\/[^\/]+).*$/,"$1/");
        var new_url="";
        var sidearm=doc.getElementsByClassName("sidearm-table");

        console.log("sidearm="+sidearm.length);
        if(sidearm!==null && sidearm!==undefined && sidearm.length>0)
        {
            console.log("Found sidearm");
            if(response.finalUrl.indexOf("coaches.aspx?path=")!==-1) parse_sidearm2(sidearm[0]);
            else parse_sidearm(sidearm[0]);
            console.log("Done sidearm");
            return;
        }
        else if(response.finalUrl.indexOf("/directory/index")!==-1
                && doc.getElementById("mainbody")!==null)
        {
            console.log("Found information directory thing");
            if(parse_info_directory(doc)) return;

        }
        if(response.finalUrl.indexOf("/staff.php")!==-1)
        {
            console.log("staff.php, doc.body.innerText="+doc.getElementById("staff-list"));
            if(doc.getElementById("staff-list")!==null)
            {
                console.log("Found staff.php staff-list");
                parse_staff_php(doc.getElementById("staff-list"));
                return;
            }
            else if(doc.getElementsByClassName("staff").length>0)
            {
                console.log("Found staff.php staff");
                parse_php_table(doc.getElementsByClassName("staff")[0]);
                return;
            }
      
        }
        if(is_sport_index(response.finalUrl,"coaches"))
        {
            console.log("Doing sports coach indexy thing");
            parse_sports_index(doc, response.finalUrl);
            return;
        }
        else if(doc.getElementsByClassName("staff_dgrd").length>0)
        {
           /* if(response.finalUrl.indexOf("staff.aspx")!==-1)
            {

                console.log(sport_map1[my_query.sport]);
                var my_url=response.finalUrl.replace(/staff\.aspx.*$/,"coaches.aspx?path="+sport_map1[my_query.sport][0]);
                console.log("my_url="+my_url+", redirecting");
                my_query.try_count++;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    my_url,

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        sports_response(response, resolve, reject);
                    },
                    onerror: function(response) { console.log("Fail with "+new_url); },
                    ontimeout: function(response) { console.log("Fail with "+new_url); }
                });
                return;
            }*/

            console.log("Found staff_dgrd");
            var script=doc.getElementById("ctl00_contentDiv").getElementsByTagName("script");
            for(j=0; j < script.length; j++)
            {
                if(script[j].innerHTML.indexOf("loadRow")!==-1) break;
//                console.log("script["+j+"]="+script[j].innerHTML);
            }
            if(j>=script.length) j=0;
            parse_staff_dgrd(doc.getElementsByClassName("staff_dgrd")[0],"staff",script[j]);
            return;
        }
        else if(doc.getElementsByClassName("coaches_dgrd").length>0)
        {
            console.log("Found coaches_dgrd");
            parse_staff_dgrd(doc.getElementsByClassName("coaches_dgrd")[0],"coaches");
            return;
        }
        else if(response.finalUrl.indexOf("/athletics/staff")!==-1 && response.finalUrl.indexOf("/athletics/staff.")===-1
               && response.finalUrl.indexOf("/athletics/staff-")===-1 && response.finalUrl.indexOf("/athletics/staff_")===-1 && response.finalUrl.indexOf("/athletics/staffdirectory")===-1)
               
        {
            console.log("Found athletics_staff");
            if(parse_athletics_staff(doc)) return;
        }
        if(response.finalUrl.indexOf(".dbml")!==-1)
        {
            console.log("Found dbml");
            if(parse_dbml(doc)) return;
        }
        if(response.finalUrl.indexOf("/athletics/staff-directory/")!==-1)
        {
            console.log("Found athletics staff directory");
        }
        if(doc.getElementById("staffdir")!==null)
        {
            console.log("Found staffdir");
            if(parse_staffdir(doc)) return;
        }
        if(parse_generic(doc)) return;
        if(my_query.try_count===0)
        {
            console.log("Found nothing, my_query.try_count="+my_query.try_count);
            //console.log("doc.body.innerHTML="+doc.body.innerHTML);
            my_query.try_count++;
            var links=doc.links;
            var has_edu=response.finalUrl.indexOf(".edu")!==-1;
            for(i=0; i < links.length; i++)
            {

                links[i].href=links[i].href.replace("https://www.mturkcontent.com/dynamic/hit",response.finalUrl);
                links[i].href=links[i].href.replace("https://www.mturkcontent.com/",begin_url);
                  links[i].href=links[i].href.replace("https://s3.amazonaws.com/",begin_url);
              //  console.log("links["+i+"].href="+links[i].href+", innerText="+links[i].innerText);
                let my_sportresult=sport_map1[my_query.sport.trim()];
              //  console.log("my_query.sport="+my_query.sport);
               // console.log("sport_map1[my_query.sport.trim()]="+sport_map1[my_query.sport.trim()]);

                if(my_sportresult!==undefined) {
                    for(j=0; j < my_sportresult.length; j++)
                    {

                       if(links[i].href.indexOf(".aspx?path="+my_sportresult[j])!==-1 ||
                           links[i].href.indexOf("staff.aspx?path="+my_sportresult[j])!==-1
                          )
                        {
                            console.log("Found good links[i] for path="+my_sportresult[j]);

                            new_url=links[i].href.replace("index.aspx","coaches.aspx").replace("staff.aspx","coaches.aspx");//+"coaches.aspx?path="+my_sportresult[j];
                           // new_url=links[i].href.replace(/\/[^\/]*\.aspx/,"/coaches.aspx");
                            new_url=begin_url+"/coaches.aspx?path="+my_sportresult[j];
                            console.log("new_url="+new_url);
                            break;
                        }
                    }
                }
                if(new_url.length>0) break;

                if(links[i].href.indexOf("index.aspx?path=")!==-1 ||
                   links[i].href.indexOf("staff.aspx?path=")!==-1) console.log("links["+i+"].href="+links[i].href);
                
                else if(is_sport_index(links[i].href,""))
                {
                    console.log("Found sports indexy thing");
                  //  new_url=begin_url+"sports/"+sport_map2[my_query.sport]+"/coaches/index"; break;

                    new_url=links[i].href;
                    if(new_url.indexOf("coaches")===-1) new_url=new_url.replace(/\/index/,"/coaches/index");
                }
                else if(links[i].href.indexOf("staff.php")!==-1)
                {
                    console.log("Found staff.php");
                    new_url=begin_url+"staff.php"; break;
                }
                else if(has_edu && !my_query.doneRedirect &&
                        (links[i].innerText.toLowerCase().indexOf("athletics")!==-1 &&
                        links[i].href.toLowerCase().indexOf("www."+get_domain_only2(begin_url.toLowerCase()))===-1 &&
                       !/mailto:\s*/.test(links[i].href))
                        ||(!my_query.doneCoaches && /coaches/i.test(links[i].innerText) && /athletics/i.test(links[i].href.toLowerCase()))

                       )
                {
                    console.log("Found new url="+links[i].href);
                    if(/coaches/i.test(links[i].innerText)) my_query.doneCoaches=true;
                    my_query.try_count=0;
                    my_query.doneRedirect=true;
                    new_url=links[i].href;
                    break;
                }

            }
            console.log("Done looping, try_count="+my_query.try_count);
            if(new_url.length===0 && !my_query.doneRedirect)
            {


                new_url=begin_url;//response.finalUrl.replace(/\/[^\/]+\/?$/,"")
                my_query.try_count=0;
                my_query.doneRedirect=true;
                console.log("Nothing found to do, trying redirect");

            }
            if(new_url.length>0)
            {
                console.log("new_url="+new_url+", redirecting");
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    new_url,

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        sports_response(response, resolve, reject);
                    },
                    onerror: function(response) { console.log("Fail with "+new_url); },
                    ontimeout: function(response) { console.log("Fail with "+new_url); }
                });
                return;
            }
            console.log("Can do nothing now");
            var search_str=get_domain_only2(my_query.url) +" athletics "; // -site:.edu";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning query search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then)
            .catch(function(val) {
                console.log("Failed dist " + val);

                return; });

        }
        else if(my_query.try_count>0)
        {
            console.log("Truly failed");
            let search_str=get_domain_only2(my_query.url) +" athletics "// -site:.edu";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning query search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then)
            .catch(function(val) {
                console.log("Failed dist " + val);

                return; });
            return;
          //  GM_setValue("returnHit",true);
        }

  
    }

    function parse_generic(doc)
    {
        return false;
        console.log("\n**** DOING parse_generic ****\n");
        var staffdir=doc.getElementsByTagName("table");
        if(staffdir.length===0) return false;
        var the_table=staffdir[0];
        var i,j, x;

        var typeTitle=the_table.getElementsByTagName("th");
        if(typeTitle.length===0)
        {
            typeTitle=the_table.querySelectorAll('[colspan="4"]');
          //  for(i=0; i < typeTitle.length; i++) { console.log("i="+i+", typeTitle[i]="+typeTitle[i].innerText); }
        }
        if(typeTitle.length===0)
        {
            console.log("*** Couldn't find either typeTitle ***");
            return parse_generic2(the_table);
        }
        try
        {
            var begin_row_index=-1;
            var end_row_index=the_table.rows.length;
            for(i=0; i < typeTitle.length; i++)
            {
                console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
                if(is_right_sport(typeTitle[i].innerText.toLowerCase()))
                {
                    begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                    if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                    break;
                }
            }
            //console.log(the_table.length);
            //if(end_row_index===undefined) end_row_index=the_table.length;
            if(begin_row_index===-1) {
                console.log("Could not find right sport");
                return;
            }
            console.log("Got right sport "+begin_row_index+"\t"+end_row_index);
            var title_map={0: "name", 1:"title",2:"email",3:"phone"};

            var curr_ret={name:"",title:"",email:"",phone:""};
            var curr_text;
            var ctr=1;
            for(i=begin_row_index; i < end_row_index; i++)
            {
                curr_ret={};
                for(j=0; j < the_table.rows[i].cells.length; j++)
                {
                    console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                    if(title_map[j]!==undefined)
                    {
                        if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 && /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                        {

                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");
                        }
                        else
                        {
                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText;
                        }
                    }
                }
                if(curr_ret.name.length<2 && the_table.rows[i].cells.length>0) curr_ret.name=the_table.rows[i].cells[0].innerText;
                console.log("curr_ret="+JSON.stringify(curr_ret));
                add_fields(curr_ret,ctr);
                ctr++;

            }
            if(!my_query.submitted)
            {
                my_query.submitted=true;
                check_and_submit();
                return true;
            }
        }
        catch(error) { console.log("Failed generic"); return false; }
    }

    function parse_generic2(the_table)
    {
        console.log("In parse_generic2");
        var i,j,x;
        var title_map={},title_map_inv={};
        if(the_table.rows.length<2) return;
        var curr_row=the_table.rows[0], curr_text;
        try
        {
            for(j=0; j < curr_row.cells.length; j++)
            {
                curr_text=curr_row.cells[j].innerText;
                if(/(name)|(coach)/i.test(curr_text)) { title_map[j]="name"; title_map_inv.name=j; }
                else if(/mail/i.test(curr_text)) { title_map[j]="email"; title_map_inv.email=j; }
                else if(/phone/i.test(curr_text)) { title_map[j]="phone"; title_map_inv.phone=j; }
                else if(/(sport)|(title)|(position)/i.test(curr_text)) { title_map[j]="title"; title_map_inv.title=j; }

            }
            console.log("title_map_inv="+JSON.stringify(title_map));
            var curr_ret={name:"",title:"",email:"",phone:""};

            var ctr=1;
            for(i=1; i < the_table.rows.length; i++)
            {
                curr_ret={name:"",title:"",email:"",phone:""};
                if(the_table.rows[i].cells.length>= title_map_inv.title)
                {
                    console.log("title="+the_table.rows[i].cells[title_map_inv.title].innerText);
                }
                if(the_table.rows[i].cells.length<= title_map_inv.title || (!is_right_sport(the_table.rows[i].cells[title_map_inv.title].innerText))) continue;
                for(j=0; j < the_table.rows[i].cells.length; j++)
                {

                    console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                    if(title_map[j]!==undefined)
                    {
                        if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 && /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                        {

                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");
                        }
                        else
                        {
                            curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText;
                        }
                    }
                }
                if(curr_ret.name.length<2 && the_table.rows[i].cells.length>0) curr_ret.name=the_table.rows[i].cells[0].innerText;
                console.log("curr_ret="+JSON.stringify(curr_ret));
                add_fields(curr_ret,ctr);
                ctr++;

            }
            if(!my_query.submitted)
            {
                my_query.submitted=true;
                check_and_submit();
                return true;
            }

        }
        catch(error) { console.log("Failed generic2 "+error); return false; }

    }

    function parse_staffdir(doc)
    {
        var staffdir=doc.getElementById("staffdir");
        if(staffdir===null ||staffdir.tagName!=="TABLE") return false;
        var the_table=staffdir;
        var i,j, x;

        var typeTitle=the_table.getElementsByTagName("th");
        var begin_row_index=-1;
        var end_row_index=the_table.rows.length;
        for(i=0; i < typeTitle.length; i++)
        {
            console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
            if(is_right_sport(typeTitle[i].innerText.toLowerCase()))
            {
                begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                break;
            }
        }
        //console.log(the_table.length);
        //if(end_row_index===undefined) end_row_index=the_table.length;
        if(begin_row_index===-1) {
            console.log("Could not find right sport");
            return;
        }
        console.log("Got right sport "+begin_row_index+"\t"+end_row_index);
        var title_map={0: "name", 1:"title",2:"email",3:"phone"};

        var curr_ret={name:"",title:"",email:"",phone:""};
        var curr_text;
        var ctr=1;
        for(i=begin_row_index; i < end_row_index; i++)
        {
            curr_ret={};
            for(j=0; j < the_table.rows[i].cells.length; j++)
            {
                console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                if(title_map[j]!==undefined)
                {
                    if(the_table.rows[i].cells[j].getElementsByTagName("a").length>0 && /^mailto:\s*/.test(the_table.rows[i].cells[j].getElementsByTagName("a")[0].href))
                    {

                        curr_ret[title_map[j]]=the_table.rows[i].cells[j].getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,"");
                    }
                    else
                    {
                        curr_ret[title_map[j]]=the_table.rows[i].cells[j].innerText;
                    }
                }
            }
            console.log("curr_ret="+JSON.stringify(curr_ret));
            add_fields(curr_ret,ctr);
            ctr++;

        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
            return true;
        }
    }


    function parse_dbml(doc)
    {
        var i,j,k;
        var the_tab=doc.getElementsByTagName("table");
        if(the_tab.length!==1) return false;
        the_tab=the_tab[0];
        var ctr=1;
        var text;
        var ret;
        console.log("Doing table");
        for(i=0; i < the_tab.rows.length; i++)
        {
            console.log("the_tab.rows[i].cells[0].colspan="+the_tab.rows[i].cells[0].getAttribute("colspan"));
            if(the_tab.rows[i].cells.length>0 && the_tab.rows[i].cells[0].getAttribute("colspan")!==null &&
              parseInt(the_tab.rows[i].cells[0].getAttribute("colspan"))>=4 &&
              is_right_sport(the_tab.rows[i].cells[0].innerText)
              )
            {
                for(j=i+1; j < the_tab.rows.length; j++)
                {
                    console.log("parsing ("+j+")="+the_tab.rows[j].innerText);
                    if(the_tab.rows[j].cells.length>0 && the_tab.rows[j].cells[0].getAttribute("colspan")!==null &&
                        the_tab.rows[j].cells[0].getAttribute("colspan")==="4")
                    {
                        break;
                    }
                    text="";
                    for(k=0; k < the_tab.rows[j].cells.length; k++)
                    {
                        text=text+the_tab.rows[j].cells[k].innerText+"\t";
                    }
                    console.log("text="+text);
                    ret=parse_data_func(text);
                    add_fields(ret,ctr);
                        ctr++;
                }
                if(!my_query.submitted)
                {
                    my_query.submitted=true;
                    check_and_submit();
                    return true;
                }
                else { return true; }
            }
        }
    }

    function parse_athletics_staff(doc)
    {
        var category=doc.getElementsByClassName("category");
        var staffdir;
        if(category.length===0) { console.log("Bad category"); return false; }
        staffdir=category[0].parentNode;
        var i,j,k;
        var children=staffdir.children;
        var title_vars=["name","title","phone","email"];
        var ctr=1;
        var curr_ret={};
        for(i=0; i < children.length; i++)
        {
            if(children[i].className.indexOf("category")!==-1 && is_right_sport(children[i].innerText))
            {

                for(j=i+1; j < children.length && children[j].className.indexOf("category")===-1; j++)
                {
                    console.log(children[j].outerHTML);
                    curr_ret={};
                    for(k=0; k < title_vars.length; k++)
                    {
                        if(children[j].getElementsByClassName(title_vars[k]).length>0)
                        {
                            if(title_vars[k]==="email" && children[j].getElementsByClassName(title_vars[k])[0].getElementsByTagName("a").length>0)
                            {
                                let the_a=children[j].getElementsByClassName(title_vars[k])[0].getElementsByTagName("a")[0];
                                if(email_re.test(the_a.href.replace(/^mailto:\s*/,"")))
                                {
                                    curr_ret[title_vars[k]]=the_a.href.replace(/^mailto:\s*/,"").match(email_re)[0];
                                }
                                else
                                {
                                     curr_ret[title_vars[k]]=children[j].getElementsByClassName(title_vars[k])[0].innerText.trim();
                                }
                            }
                            else curr_ret[title_vars[k]]=children[j].getElementsByClassName(title_vars[k])[0].innerText.trim();
                        }
                        else
                        {
                            console.log("title_vars["+k+"]="+title_vars[k]+", not found");
                        }

                    }
                    add_fields(curr_ret,ctr);
                    ctr++;
                }

            }
        }
        return true;
    }
    function parse_sports_index(doc, url)
    {
        var info=doc.getElementsByClassName("info");
        var i,j,ctr=1;
        var ret;
        for(i=0; i < info.length && ctr<=10; i++)
        {
            ret=parse_data_func(info[i].innerText);

            add_fields(ret,ctr);
            ctr++;
        }

        if(info.length>0 && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
        }
        else if(info.length===0 && !my_query.submitted)
        {
            var mainbody=doc.getElementById("mainbody");
            if(mainbody!==null)
            {
                if(url.indexOf("/coaches/")!==-1 && doc.getElementsByClassName("player-info").length>0)
                {
                    parse_sports_index_coach(doc);
                    return;

                }
                console.log("Found mainbody");
                let the_table=mainbody.getElementsByTagName("table")[0];
                console.log("the_table="+the_table.rows.length);
                for(i=0; i < the_table.rows.length; i++)
                {

                    for(j=0; j < the_table.rows[i].cells.length; j++)
                    {
                        console.log("("+i+","+j+": "+the_table.rows[i].cells[j].innerText);
                        ret=parse_data_func(the_table.rows[i].cells[j].innerText);
                        add_fields(ret,ctr);
                        ctr++;
                    }
                }
                if(!my_query.submitted)
                {
                    my_query.submitted=true;
                    check_and_submit();
                }
            }
            else
            {
                console.log("Did not find mainbody, returning");
                GM_setValue("returnHit",true);
            }
        }

    }

    function parse_sports_index_coach(doc)
    {
        var i,j,x;
        var player_info=doc.getElementsByClassName("player-info");
        var ret;
        var tab;
        var field_names={"Title: ": "title", "Phone: ":"phone","Email: ":"email"};
        var ctr=1;
        for(i=0; i < player_info.length; i++)
        {
            ret={name:"",title:"",phone:"",email:""};
            ret.name=player_info[i].getElementsByClassName("name")[0].innerText.trim();
            tab=player_info[i].getElementsByTagName("table");
            if(tab.length>0)
            {
                for(j=0; j < tab[0].rows.length; j++)
                {
                    let curr_row=tab[0].rows[j].innerText;
                    for(x in field_names)
                    {
                        if(curr_row.indexOf(x)!==-1)
                        {
                            ret[field_names[x]]=curr_row.replace(x,"").trim();
                        }

                    }
                }
            }
            add_fields(ret,ctr);
            ctr++;
        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
        }
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        my_query.try_count=0;
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {

            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < 6 && i < b_algo.length; i++)
            {

                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href.replace("m.facebook.com/","www.facebook.com/").replace(/(https?:\/\/[^\/]*\/[^\/]+)\/posts.*$/,"$1");
                b_url=b_url.replace(/(https?:\/\/[^\/]*\/[^\/]+)\/about.*$/,"$1").replace(/(https?:\/\/[^\/]*\/[^\/]+)\/reviews.*$/,"$1");

                b_caption=b_algo[i].getElementsByClassName("b_caption");
                if(b_caption.length>0) b_caption=b_caption[0].innerText;
                else b_caption="";

                console.log("i="+i+", b_url="+b_url+", b_name="+b_name);



                if(!is_bad_url(b_url,bad_urls,-1) && (get_domain_only1(b_url.toLowerCase())!==get_domain_only1(my_query.url))
                  && (get_domain_only2(b_url.toLowerCase())!==get_domain_only2(my_query.url) ||
                     /^athletics/.test(get_domain_only1(b_url.toLowerCase()))
                     )
                  )
                {
                    console.log("Found something");
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                console.log("Found good="+b_url);
                resolve(b_url);
                return;
            }


        }
        catch(error)
        {
            console.log("Error "+error);
            reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }

        console.log("Nothing found");
        /* document.getElementsByName("no_page")[0].checked=true;
        check_and_submit(check_function,automate);*/
        GM_setValue("returnHit",true);
        return;

    }

    function query_promise_then(url)
    {
        if(my_query.doneNewUrl) { console.log("Already tried new "); GM_setValue("returnHit",true); return; }
        my_query.doneNewUrl=true;
        my_query.url=url;
        console.log("New query url="+my_query.url);
        const sportsPromise = new Promise((resolve, reject) => {
            console.log("Beginning dist search");
           sports_search(resolve, reject);
        });
        sportsPromise.then(sports_promise_then
        )
        .catch(function(val) {
           console.log("Failed dist " + val);
        });

    }

    function parse_staff_dgrd(the_table,prefix,the_script)
    {

        var i,j,k, x;

        var split_script;
        var script_regex=/\(\'([^,]+)\',([^\),]+),([^\),]+),\s*([\d]+),\s*([\d]+),\s*([^\),]+)\);/;
        var script_array=[];
        if(prefix==="coaches")
        {
            parse_info_directory_table(the_table);
            return;
        }
        split_script=the_script.innerHTML.split("\n");
        console.log("the_script.innerHTML="+the_script.innerHTML);
        var new_elem;
        for(i=0; i < split_script.length; i++)
        {
            if(script_regex.test(split_script[i]))
            {
                let the_match=split_script[i].match(script_regex);
                new_elem={text: the_match[1].replace("\\\'","\'"), className: the_match[3].replace("'","").replace("'",""), index: the_match[4], colspan: the_match[5]};
                script_array.push(new_elem);
                console.log("new_elem="+JSON.stringify(new_elem));
            }
        }
        var curr_row, curr_cell;
        for(i=0; i < script_array.length; i++)
        {
            //console.log("script_array[i].index+1="+(parseInt(script_array[i].index)+1));
            curr_row=the_table.insertRow(parseInt(script_array[i].index)+1);
            curr_cell=curr_row.insertCell(0);
            curr_cell.setAttribute('colspan',script_array[i].colspan);
            curr_cell.innerText=script_array[i].text;
            curr_cell.className=script_array[i].className;
            //curr_row.className=script_array[i].className;
        }



 //console.log(the_table.innerHTML);

        var typeTitle=the_table.getElementsByClassName("staff_dgrd_category");
        var begin_row_index=-1;
        var found_good=false;
        var end_row_index=the_table.rows.length;
        console.log("typeTitle.length="+typeTitle.length);
        console.log("the_table.rows.length="+the_table.rows.length);
        for(i=0; i < the_table.rows.length; i++)
        {
            console.log("("+i+"), "+the_table.rows[i].innerText);
        }
        for(k=0; k < 2; k++)
        {
            for(i=0; i < typeTitle.length; i++)
            {
                console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
                if(is_right_sport(typeTitle[i].innerText.toLowerCase()))
                {
                    begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                    if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                    found_good=true;
                    break;
                }
            }
            if(found_good) break;
            if(k===1) {
                console.log("Could not find right sport");
                return;
            }
            else {
                my_query.short_sport=my_query.sport.replace(/^women\'s\s*/i,"").replace(/^men\'s\s*/i,"");
                console.log("Failed first try, adding short sport="+my_query.short_sport);
            }

        }
        var title_map={"staff_dgrd_fullname": "name", "staff_dgrd_staff_title":"title","staff_dgrd_staff_email":"email","staff_dgrd_staff_phone":"phone"};

        var curr_ret={name:"",title:"",email:"",phone:""};
        var curr_text;
        var ctr=1;
        console.log("begin_row_index="+begin_row_index+", end_row_index="+end_row_index+", length="+the_table.rows.length);
        for(i=begin_row_index; i < end_row_index; i++)
        {
            curr_ret={};
            for(j=0; j < the_table.rows[i].cells.length; j++)
            {
               
                if(title_map[the_table.rows[i].cells[j].className]!==undefined)
                {
                    if(the_table.rows[i].cells[j].className.indexOf("staffEmail")!==-1 )
                    {
                        console.log(the_table.rows[i].cells[j].outerHTML);
                        var inner_a=the_table.rows[i].cells[j].getElementsByTagName("a");
                        if(inner_a.length>0 && inner_a[0].dataset.cfemail!==undefined)
                        {
                            curr_ret[title_map[the_table.rows[i].cells[j].className]]=decryptCloudFlare(the_table.rows[i].cells[j].dataset.cfemail);
                        }
                       else curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText.trim();
                    }
                    else
                    {
                        curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText.trim();
                    }
                }
            }
            add_fields(curr_ret,ctr);
            ctr++;

        }

         if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
            return;
        }

    }
    function parse_staff_php(staffList)
    {
        var i,j;
        var dept=staffList.getElementsByClassName("staff-department");
        if(dept.length===0) dept=staffList.getElementsByClassName("department");
        var sec_title;
        for(i=0; i < dept.length; i++)
        {
            sec_title=dept[i].getElementsByClassName("sec_title");
            if(sec_title.length===0) sec_title=dept[i].getElementsByClassName("section-title");
            //console.log("sec_title["+i+"]="+sec_title[0].innerText);
            if(sec_title.length>0 && is_right_sport(sec_title[0].innerText))
            {
                console.log("in here");
                parse_inner_staff_php(dept[i])
                if(!my_query.submitted)
                {
                    my_query.submitted=true;
                    check_and_submit();
                    return;
                }
            }
        }

    }

    function parse_inner_staff_php(dept)
    {
        console.log("Parsing inner staff php");
        var i,j;
        var member=dept.getElementsByClassName("member");
        var ctr=1;
        var ret;
        for(i=0; i < member.length; i++)
        {
            ret={name:"",email:"",title:"",phone:""};
            try
            {
                if(member[i].getElementsByClassName("name").length>0)
                    ret.name=member[i].getElementsByClassName("name")[0].innerText.trim();
                if(member[i].getElementsByClassName("position").length>0)
                    ret.title=member[i].getElementsByClassName("position")[0].innerText.trim();
                if(member[i].getElementsByClassName("email").length>0)
                    ret.email=member[i].getElementsByClassName("email")[0].innerText.trim();
                 if(member[i].getElementsByClassName("phone").length>0)
                     ret.phone=member[i].getElementsByClassName("phone")[0].innerText.trim();
                add_fields(ret,ctr);
                ctr++;
            }
            catch(e) { console.log("error "+e); }
        }
    }

    /* parse pages with /information/directory/index */
    function parse_info_directory(doc)
    {
        var i,j;
        var mainbody=doc.getElementById("mainbody");
        var h2=mainbody.getElementsByTagName("h2");
        if(h2.length < mainbody.getElementsByTagName("h1").length) h2=mainbody.getElementsByTagName("h1");
        for(i=0; i < h2.length; i++)
        {
            console.log("h2["+i+"]="+h2[i].innerText);
            if(h2[i].innerText.length>0 && is_right_sport(h2[i].innerText)&& h2[i].nextElementSibling.tagName==="TABLE")
            {
                return parse_info_directory_table(h2[i].nextElementSibling);
                
            }
        }
        console.log("Info directory failed");
        return false;
    }
    function assign_title_map(header_row)
    {
        var ret={};
        var i;
        var curr_cell;
        for(i=0; i < header_row.cells.length; i++)
        {
            curr_cell=header_row.cells[i].innerText.toLowerCase();
            if(curr_cell.indexOf("name")!==-1)
            {
                ret[i]="name";
            }
            else if(curr_cell.indexOf("title")!==-1) ret[i]="title";
            else if(curr_cell.indexOf("phone")!==-1 || curr_cell.indexOf("extension")!==-1) ret[i]="phone";
            else if(curr_cell.indexOf("mail")!==-1) ret[i]="email";
        }
        return ret;
    }

    function parse_php_table(the_table)
    {
        var i,j, x;

        var typeTitle=the_table.getElementsByClassName("staffTypeTitle");
        var begin_row_index=-1;
        var end_row_index=the_table.rows.length;
        for(i=0; i < typeTitle.length; i++)
        {
            console.log("typeTitle["+i+"]="+typeTitle[i].innerText);
            if(is_right_sport(typeTitle[i].innerText.toLowerCase()))
            {
                begin_row_index=typeTitle[i].parentNode.rowIndex+1;
                if(i < typeTitle.length-1) end_row_index=typeTitle[i+1].parentNode.rowIndex;
                break;
            }
        }
        //console.log(the_table.length);
        //if(end_row_index===undefined) end_row_index=the_table.length;
        if(begin_row_index===-1) {
            console.log("Could not find right sport");
            return;
        }
        console.log("Got right sport "+begin_row_index+"\t"+end_row_index);
        var title_map={"staffName": "name", "staffPosition":"title","staffEmail":"email","staffPhone":"phone"};

        var curr_ret={name:"",title:"",email:"",phone:""};
        var curr_text;
        var ctr=1;
        for(i=begin_row_index; i < end_row_index; i++)
        {
            curr_ret={};
            for(j=0; j < the_table.rows[i].cells.length; j++)
            {
                console.log("the_table.rows["+i+"].cells["+j+"].innerText="+the_table.rows[i].cells[j].innerText);
                if(title_map[the_table.rows[i].cells[j].className]!==undefined)
                {
                    if(the_table.rows[i].cells[j].className.indexOf("staffEmail")!==-1 )
                    {
                        console.log(the_table.rows[i].cells[j].outerHTML);
                        var inner_span=the_table.rows[i].cells[j].getElementsByClassName("__cf_email__");
                        if(inner_span.length>0 && inner_span[0].dataset.cfemail!==undefined)
                        {
                            curr_ret[title_map[the_table.rows[i].cells[j].className]]=decryptCloudFlare(inner_span[0].dataset.cfemail);
                        }
                        else curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText;
                    }
                    else
                    {
                        curr_ret[title_map[the_table.rows[i].cells[j].className]]=the_table.rows[i].cells[j].innerText;
                    }
                }
            }
            add_fields(curr_ret,ctr);
            ctr++;

        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
            return;
        }
    }

    function parse_info_directory_table(the_table)
    {
        var i,j, x;
        var header=the_table.rows[0];
        if(header===undefined || header===null) console.log("Error with roster-header");
        var title_map=assign_title_map(header);
        var curr_ret={};
        var curr_text;
        var ctr=1;
        for(i=1; i < the_table.rows.length; i++)
        {
            curr_ret={};
            for(x in title_map)
            {

                console.log(the_table.rows[i].cells[x].outerHTML);
                curr_ret[title_map[x]]=the_table.rows[i].cells[x].innerText.trim();
            }
            add_fields(curr_ret,i);

        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
        }
        return true;
    }
    function parse_sidearm(sidearm)
    {
        console.log("In parse_sidearm");
        var cat=sidearm.getElementsByClassName("sidearm-staff-category");
        var i,j;
        var curr_pos=0;
        var next_elem;
        var curr_th;
        var curr_name="", curr_title="", curr_phone="", curr_email="";
        for(i=0; i < cat.length; i++)
        {
            console.log("cat[i].innerText="+cat[i].innerText.toLowerCase().trim());
            if(is_right_sport(cat[i].innerText.toLowerCase().trim()))
            {
                j=cat[i].rowIndex+1;
                console.log(sidearm.rows[j].className);
                console.log("***sidearm.rows.length="+sidearm.rows.length);
                while(j >=0 && j < sidearm.rows.length && (sidearm.rows[j].className==="sidearm-staff-member" || sidearm.rows[j].className===""))
                {
                    var k;
                    console.log("j="+j+", "+sidearm.rows[j].cells.length);
                    curr_th=sidearm.rows[j].getElementsByTagName("th")[0];
                    for(k=0; k < sidearm.rows[j].cells.length; k++)
                    {
                        console.log("for "+k+", "+sidearm.rows[j].cells[k].headers);
                        if(sidearm.rows[j].cells[k].headers.indexOf("col-fullname")!==-1)
                        {
                            curr_name=sidearm.rows[j].cells[k].innerText.trim();
                        }
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_title")!==-1)
                        {
                            curr_title=sidearm.rows[j].cells[k].innerText.trim();
                        }
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_email")!==-1)
                        {
                            curr_email=sidearm.rows[j].cells[k].innerText.trim();
                        }
                        else if(sidearm.rows[j].cells[k].headers.indexOf("col-staff_phone")!==-1)
                        {
                            curr_phone=sidearm.rows[j].cells[k].innerText.trim();
                        }
                    }
                    add_to_query(curr_name, curr_title, curr_email, curr_phone);
                    j++;
                }
                break;

            }
        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
        }
        return;
    }
    function parse_sidearm2(sidearm)
    {
        console.log("In parse_sidearm2");
        var i,j, x;
        var begin_row=1;
        var header=sidearm.rows[0];
        if(header===undefined || header===null) console.log("Error with roster-header");
        var title_map=assign_title_map(header);
        var map_ct=0;
        for(x in title_map) map_ct++;
        console.log("title_map="+JSON.stringify(title_map));
      //  console.log("title_map.length="+title_map.length);
        if(map_ct===0)
        {
            begin_row=0;
            title_map={0:"name",1:"title",2:"email",3:"phone"};
        }
        var curr_ret={};
        var curr_text, curr_cell;
        var ctr=1;
        for(i=1; i < sidearm.rows.length; i++)
        {
            curr_ret={};
            for(x in title_map)
            {

                curr_ret[title_map[x]]=sidearm.rows[i].cells[x].innerText.trim();
            }
            for(j=0; j < sidearm.rows[i].cells.length; j++)
            {
                curr_cell=sidearm.rows[i].cells[j];
                if(curr_cell.getElementsByTagName("a").length>0 && /^mailto:/.test(curr_cell.getElementsByTagName("a")[0].href))
                {
                    var temp_str=curr_cell.getElementsByTagName("a")[0].href.replace(/^mailto:\s*/,""),temp_match;
                    temp_match=temp_str.match(email_re);
                    if(temp_match!==null) { curr_ret.email=temp_match[0]; }
                }

            }
            add_fields(curr_ret,i);
        }
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
        }
    }
    function add_to_query(name, title, email, phone)
    {
        console.log("Name="+name+", title="+title+", email="+email+", phone="+phone);
        my_query.curr_pos=my_query.curr_pos+1;
        var the_name=parse_name(name);
        if(my_query.curr_pos<=10)
        {
            document.getElementById("First Name (Coach #"+my_query.curr_pos+")").value=the_name.fname;
            document.getElementById("Last Name (Coach #"+my_query.curr_pos+")").value=the_name.lname;
            document.getElementById("Job Title (Coach #"+my_query.curr_pos+")").value=title;
            if(!email_re.test(email)) email="";
            document.getElementById("Email Address (Coach #"+my_query.curr_pos+")").value=email;
            document.getElementById("Phone Number (Coach #"+my_query.curr_pos+")").value=phone;
        }
    }
      function setup_UI()
    {
        var i;
        var WDC=document.getElementById("WebsiteDataCollection");
        var row=WDC.getElementsByClassName("row");
        var x;
        var outer_panel=document.createElement("div");
        outer_panel.className="row";
        outer_panel.style="margin: 10px 0px";
        var my_panel=document.createElement("div");
        my_panel.className="col-xs-12 col-md-12";

        var second_panel=document.createElement("div");
         var select_style="margin: 2px 6px 2px 2px";
        second_panel.className="row";
        second_panel.style="margin: 10px 0px";
        var email_type_label=document.createElement("label");
        var email_label_atts={"style": "margin: 2px 5px 2px 2px", "innerHTML": "Email Format"};
        var email_domain_label=document.createElement("label");
        var email_domain_atts={"style": "margin: 2px 5px 2px 2px", "innerHTML": "Email Domain"};
        var email_domain_input=document.createElement("input");
        var email_input_attrs={"id": "email_domain", "name": "email_domain", "style": "margin: 2px 5px 2px 2px"};
        var guess_email_button=document.createElement("input");




        var guess_button_attrs={"type": "button", "id": "guess_email_button", "style": "margin: 2px 10px 2px 2px","value": "Guess Emails",
                               };
        for(x in guess_button_attrs) guess_email_button.setAttribute(x, guess_button_attrs[x]);
        guess_email_button.innerHTML="Guess Emails";
        //guess_email_button.onClick=

        email_type_label.innerHTML="Email Format";
        email_domain_label.innerHTML="Email Domain";

        for(x in email_label_atts) email_type_label.setAttribute(x,email_label_atts[x]);
        for(x in email_domain_atts) email_domain_label.setAttribute(x,email_domain_atts[x]);
        for(x in email_input_attrs) email_domain_input.setAttribute(x,email_input_attrs[x]);


        var email_format_select=document.createElement("select");
        var email_select_attrs={"id": "email_select", "name": "email_select", "style": select_style};
        for(x in email_select_attrs) email_format_select.setAttribute(x, email_select_attrs[x]);
        email_format_select.innerHTML='<option value="jsmith" selected>jsmith</option>'+
            '<option value="smithj">smithj</option>'+
            '<option value="john.smith">john.smith</option>'+
            '<option value="john_smith">john_smith</option>'+
            '<option value="smith.john">smith.john</option>'+
            '<option value="smith_john">smith_john</option>';

        second_panel.appendChild(email_type_label);
        second_panel.appendChild(email_format_select);
        second_panel.appendChild(email_domain_label);
        second_panel.appendChild(email_domain_input);
        second_panel.appendChild(guess_email_button);


        var flip_button = document.createElement("input");
        var no_flip_button = document.createElement("input");
        var multiple_rows=document.createElement("input");
        var multiple_row_atts={"type": "checkbox", "style": "margin: 2px 5px 2px 2px", "name": "mult_rows", "id": "mult_rows"};
        for(x in multiple_row_atts) multiple_rows.setAttribute(x,multiple_row_atts[x]);

        var true_label=document.createElement("label");
        var false_label=document.createElement("label");
        var column_label=document.createElement("label");
        var lines_row_label=document.createElement("label");

        var multrow_label=document.createElement("label");
        var multrow_label_atts={"style": "margin: 2px 5px 2px 2px", "innerHTML": "Multiple Rows"};
        for(x in multrow_label_atts) multrow_label.setAttribute(x,multrow_label_atts[x]);
        multrow_label.innerHTML="Multiple Rows";
        multrow_label.style.margin="2px 5px 2px 2px";
        var col_select=document.createElement("select");

        var col_select_attrs={"id": "col_select", "name": "col_select", "style": select_style};
        var lines_row_select_attrs={"id": "lines_row_select", "name": "lines_row_select", "style": select_style};
        var lines_row_select=document.createElement("select");
        for(x in col_select_attrs) col_select.setAttribute(x, col_select_attrs[x]);
        for(x in lines_row_select_attrs) lines_row_select.setAttribute(x, lines_row_select_attrs[x]);

        lines_row_label.innerHTML="Lines/Row";
        lines_row_label.style.margin="2px 5px 2px 2px";
        var temp_opt;
        for(i=0; i <= 4; i++)
        {
            temp_opt=document.createElement("option");
            temp_opt.value=i;
            temp_opt.innerHTML=i;
            if(i==0) temp_opt.selected=true;
            col_select.appendChild(temp_opt);
        }
        for(i=1; i <= 8; i++)
        {
            temp_opt=document.createElement("option");
            temp_opt.value=i;
            temp_opt.innerHTML=i;
            if(i==1) temp_opt.selected=true;
            lines_row_select.appendChild(temp_opt);
        }
        true_label.innerHTML="Flip";
        true_label.style.margin="2px 5px";
        false_label.innerHTML="Don't Flip";
        false_label.style.margin="2px 5px 2px 10px";
        column_label.innerHTML="Begin Col";
        column_label.style.margin="2px 10px";
        var flip_button_attr={"style": "margin: 2px 5px", "type": "radio", "name": "is_flipped", "id": "flipped_true", "value": "false"};
        var no_flip_button_attr={"style": "margin: 2px 5px", "type": "radio", "name": "is_flipped", "id": "flipped_false", "value": "true",
                                "checked": "true"};
        for(x in flip_button_attr) flip_button.setAttribute(x,flip_button_attr[x]);
        for(x in no_flip_button_attr) no_flip_button.setAttribute(x,no_flip_button_attr[x]);
        my_panel.appendChild(flip_button);
        my_panel.insertBefore(true_label,flip_button);
        my_panel.appendChild(false_label);
        my_panel.appendChild(no_flip_button);
        my_panel.appendChild(column_label);
        my_panel.appendChild(col_select);
        my_panel.appendChild(multrow_label);
        my_panel.appendChild(multiple_rows);
        my_panel.appendChild(lines_row_label);
        my_panel.appendChild(lines_row_select);

        my_panel.innerHTML=my_panel.innerHTML+'<label style="margin: 2px 5px">Skip Nosubject</label>'+
            '<input type="checkbox" name="skip_no" id="skip_no"></input>';

        outer_panel.appendChild(my_panel);
        WDC.insertBefore(second_panel,row[1]);
        WDC.insertBefore(outer_panel,second_panel);
 document.getElementById("mult_rows").checked=true;

    }
    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++) {
            if(to_check.indexOf(prefixes[j])===0) return true; }
        return false;
    }
    function is_right_sport(sports_str)
    {

     //   console.log("my_query.sport.toLowerCase()="+my_query.sport.toLowerCase().trim()+",\n\tsports_str="+sports_str.trim().toLowerCase());
        if(sports_str.length===0) return false;

sports_str=sports_str.replace(/\\\'/g,"'");
        sports_str=sports_str.replace(/\s\s+/g," ");
        sports_str=sports_str.replace(/^(.*) - (.*en(?:\'s)?)$/,"$2 $1");
        sports_str=sports_str.replace(/\//," and ");
        sports_str=sports_str.replace(/^(.*) \(([^\)]+)\)$/,function(match,p1,p2)
                                      {
            if(p2==="m") { return "Men's "+p1; }
            else if(p2==="w") { return "Women's "+p1; }
            else if(p2.indexOf("&")!==-1 || p2.indexOf(" and ")!==-1 || p2.indexOf("men's/women's")!==-1)
            {
                if(my_query.sport.indexOf("Men's")!==-1) {
                return "Men's "+p2; }
                else return "Women's "+p2;
            }

            else if(/women/i.test(p2)) { return "Women's "+p1; }
            else if(/^men/i.test(p2)) { return "Men's "+p1; }
            return p1+" "+p2;
        });
         console.log("new sports_str="+sports_str);
        sports_str=sports_str.replace(/^((?:Men)|(?:Women))\s/i,"$1's ");
        sports_str=sports_str.replace(/Men\'s\s*(?:and|&)\s*Women\'s\s*/i, function(match) {
            if(my_query.sport.indexOf("Men's")!==-1) {
                return "Men's "; }
            else return "Women's ";
        }
            );

         console.log("new sports_str="+sports_str);
        if((my_query.short_sport.length>0 && my_query.short_sport.trim().toLowerCase().indexOf(sports_str.toLowerCase()) === 0) ||
           my_query.sport.trim().toLowerCase().indexOf(sports_str.trim().toLowerCase())===0
          || sports_str.trim().toLowerCase().indexOf(my_query.sport.trim().toLowerCase())===0 || (
            my_query.short_sport.length>0 && sports_str.trim().toLowerCase().indexOf(my_query.short_sport.toLowerCase())===0)
          )
        {
            console.log("Good sport");
            return true;
        }
        return false;

    }


      function sports_search(resolve,reject) {
        //var search_str="school district "+my_query.name+" "+my_query.city+" "+my_query.state+" -site:publicschoolsk12.com";
//        if(!first_try) google_search_str=google_search_str+" "+my_query.country;
       // console.log("Searching with bing for "+search_str);
        //var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
   //       console.log("search_URIBing=\n"+search_URIBing);
        var domain_URL=my_query.url;
          if(domain_URL.indexOf(".pdf")!==-1) domain_URL=domain_URL.replace(/\/[^\.\/]+\.pdf.*$/,"/");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    domain_URL,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);

             sports_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }
    function get_domain_only2(the_url)
    {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        ret=ret.replace(/.*\.([^\.]+\.[^\.]+)$/,"$1");
        return ret;
    }

    function get_domain_only1(the_url)
    {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");

        return ret;
    }
    /* Following the finding the district stuff */
    function sports_promise_then(to_parse) {

      
    }

    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
                //   console.log("On load in crunch_response");
                //    crunch_response(response, resolve, reject);
                callback(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


        });
    }

    function init_TaylorFodor()
    {
 //       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var well=document.getElementsByClassName("well");
        setup_UI();
        var i;

        for(i=1; i<=10; i++) {
            //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
            var curr_id=(i).toString();
            if(i < 10) curr_id=""+curr_id;
            if(document.getElementsByName("First Name (Coach #"+curr_id+")").length>0)
            {
               document.getElementsByName("First Name (Coach #"+curr_id+")")[0].addEventListener("paste",do_data_paste);
             //   document.getElementsByName("Email Address (Coach #"+curr_id+")")[0].addEventListener("paste",convert_email);
            }

        }
        my_query={url: well[0].innerText, sport: well[1].innerText, short_sport: "", curr_pos: 0, try_count: 0,
                  doneRedirect: false, doneNewUrl: false, doneCoaches: false, doneSorry: false};
       /* if(my_query.company.length==0){
            my_query.company=my_query.fname+" "+my_query.lname+" lawyer";
        }*/
        my_query.url=my_query.url.replace("/information/directory/home","/information/directory/index");
        if(my_query.sport==="Women's Volleyball")
        {
            my_query.short_sport="Volleyball";
        }
        if(my_query.sport==="Women's Field Hockey")
        {
            my_query.sport="Field Hockey";
            my_query.short_sport="Field Hockey";
        }
        if(my_query.sport==="Men's Water Polo")
        {
            my_query.sport="Men's Water Polo";
            my_query.short_sport="Water Polo";
        }
        if(my_query.sport==="Men's Swimming")
        {
            my_query.sport="Men's Swimming";
            my_query.short_sport="Swimming";
        }

        if(my_query.sport==="Women's Swimming")
        {
            my_query.sport="Women's Swimming";
            my_query.short_sport="Swimming";
        }
        if(my_query.sport==="Wrestling")
        {
            my_query.sport="Men's Wrestling";
            my_query.short_sport="Wrestling";
        }

        console.log("my_query="+JSON.stringify(my_query));
      

        var search_str, search_URI, search_URIBing;

        const sportsPromise = new Promise((resolve, reject) => {
            console.log("Beginning dist search");
           sports_search(resolve, reject);
        });
        sportsPromise.then(sports_promise_then
        )
        .catch(function(val) {
           console.log("Failed dist " + val);
            var search_str=get_domain_only2(my_query.url) +" athletics ";// -site:.edu";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning query search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed dist " + val);
            });


        });







    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_TaylorFodor();
        }

    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */


        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();