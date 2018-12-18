// ==UserScript==
// @name         TaylorFodorTeams2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape the teams
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
    var good_count,bad_count;

    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["facebook.com","instagram.com","twitter.com","yelp.com","webnode.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var sport_map1={
        "Baseball":["baseball","bsb","bb"],
        "Field Hockey":["fhockey","fhock","fh"],
        "Football":["football","m-footbl","fball"],

        "Men's Basketball":["mbball","mbasketball","mbasket","mbkb","m-baskbl"],
        "Men's Soccer":["msoc","m-soccer","msoccer"],
        "Men's Swimming": ["mswim","swim","msd","mswimdive","m-swim"],
        "Men's Water Polo": ["mwpolo"],
        "Softball": ["softball","sball"],
        "Women's Basketball":["wbball","wbkb","w-baskbl","wbasket"],
        "Women's Soccer":["wsoc","w-soccer"],
        "Women's Swimming":["wswim","swim","wsd","wswimdive","w-swim"],
        "Women's Volleyball":["wvball","vball","volleyball","w-volley"],
        "Wrestling":["wrestling","wrest"],
    "Men's Wrestling":["wrestling","wrest"]};
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
    var sport_map3={"Baseball":1,
                    "Men's Basketball":3,
                    "Women's Soccer":8,
        "Women's Volleyball":10};
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
        GM_setValue("good_count",good_count+1);
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

    function check_if_good(doc,url,response)
    {

         let my_sportresult=sport_map1[my_query.sport.trim()];
                console.log("Blurg2 "+my_sportresult);
        var i,j;

        for(j=0; j < my_sportresult.length; j++)
        {
            console.log("j="+j);


            var tempRegExp=new RegExp(my_sportresult[j]+"\\/[\\d]+-[\\d]+\\/roster");

            if(tempRegExp.test(response.finalUrl))
            {
                console.log("Found sportsyearroster");
                if(parse_sportsyearroster(doc,url))                 return true;
            }
           var sportReg=new RegExp(my_sportresult[j]+"/roster");
            if(sportReg.test(response.finalUrl) && doc.getElementsByClassName("athletics-roster").length>0)
            {
                console.log("Found athleticsroster");
                if(parse_athleticsroster(doc.getElementsByClassName("athletics-roster")[0],url)) return true;
            }
        }
        console.log("Done first");
        if(/SportSelect\.dbml/i.test(url))
        {
            if(parse_dbml(doc)) return true;
        }
        if(/roster\/[\d]+\/[\d]+\.php/.test(url))
        {
            console.log("matched numnum");
            if(parse_numnum(doc)) return true;
        }
        if(/roster\.aspx/.test(url))
        {
            console.log("matched roster_aspx");
            if(parse_roster_aspx(doc,response.finalUrl)) return true;
        }

        if(doc.getElementsByClassName("dataTable").length>0)
        {
            var table=doc.getElementsByClassName("dataTable")[0];
            console.log("dataTable");
            if(table.tagName==="TABLE")
            {
                console.log("dataTable");
                if(parse_innertable1(table)) return true;
            }
        }
        if(doc.getElementById("sortable_roster")!==null)
        {
            console.log("sortable");
            if(parse_innertable1(doc.getElementById("sortable_roster"))) return true;
        }
        if(doc.getElementsByClassName("entry-title").length>0 && doc.getElementsByClassName("entry-title").length===1+doc.getElementsByClassName("entry-summary").length)
        {
            console.log("Found entry-title");
        //    if(parse_entrytitle(doc,url)) return;

        }
        if(/nwacsports\.org/.test(url)&&doc.getElementsByTagName("table").length>=4)
        {
            console.log("nwac");
          try
            {
                if(parse_innertable1(doc.getElementsByTagName("table")[3])) return true;
            }
            catch(error) { console.log("Failed with generic table"); }
        }
        if(doc.getElementsByTagName("figcaption").length>0)
        {

            if(parse_figure_caption(doc.getElementsByTagName("figcaption"))) return true;
        }
        /*else if(doc.getElementsByClassName("caption").length>0)
        {
            if(parse_caption(doc.getElementsByClassName("caption"))) return true;
        }*/
        if(doc.getElementsByClassName("filter-player-container").length>0)
        {
            if(parse_player(doc.getElementsByClassName("filter-player-container"))) return true;
        }
        if(doc.getElementsByClassName("team_rosters").length>0)
        {
            if(parse_team_rosters(doc.getElementsByClassName("team_rosters")[0],response.finalUrl)) return true;
        }

        if(doc.getElementsByTagName("table").length>0)
        {
            console.log("\nTrying generic table");
            //let result;
            for(i=0; i < doc.getElementsByTagName("table").length; i++)
            {
                if(!/name|(player\s*)/i.test(doc.getElementsByTagName("table")[i].innerText)) continue;
                try
                {
                    if(parse_innertable1(doc.getElementsByTagName("table")[i])) return true;
                }
                catch(error) { console.log("Failed with generic table"); }
            }
        }
        return false;
    }




    function sports_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i,j,k;
        var found_athletics=false,found_index=false, found_other_roster=false,other_roster_url="";
        my_query.phone="";
        let my_sportresult=sport_map1[my_query.sport.trim()];
         var found_good_url=false;
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


        if(/splashPage\/[^\/]*\.php$/.test(response.finalUrl) && !my_query.doneSorry)
        {
            let new_url=response.finalUrl.replace(/^(https?:\/\/[^\/]+\/).*$/,"$1index.php");
            console.log("new splash _url="+new_url);
            my_query.doneSorry=true;
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

        var url=response.finalUrl;
        console.log("url="+url);
        var begin_url=response.finalUrl.replace(/(https?:\/\/[^\/]+).*$/,"$1/");
        var new_url="",links=doc.links;
        console.log("Blurg "+my_query.sport.trim());


        if(check_if_good(doc,url,response)) return true;

        console.log("Failed");
        if(/\.aspx\?path/.test(url) && !/roster\.aspx\?path/.test(url))
        {

            new_url=url.replace(/\/([^\/])+\.aspx\?path/,"/roster.aspx?path");
            console.log("Found aspx path,new_url="+new_url);
            found_good_url=true;

        }
        for(i=0; i < links.length && !found_good_url; i++)
        {
            if(found_good_url) break;
            /* Fix mturkcontent shit */
            if(links[i].href.indexOf("mturkcontent.com")!==-1 || links[i].href.indexOf("amazonaws.com")!==-1)
            {
                if(links[i].href.indexOf("mturkcontent.com/dynamic")!==-1)
                {
                    links[i].href=links[i].href.replace(/(https?:\/\/(?:[^\/]+\/)+)([^\/]*$)/,
                                                    url.replace(/(https?:\/\/(?:[^\/]+\/)+)([^\/]*$)/,"$1")+"$2");
                }
                else if(links[i].href.indexOf("mturkcontent.com")!==-1)
                {
                    links[i].href=links[i].href.replace("https://www.mturkcontent.com",begin_url).replace(/([A-Za-z])\/\//,"$1/");
                }
                else if(links[i].href.indexOf("amazonaws.com")!==-1)
                {
                    links[i].href=links[i].href.replace("https://s3.amazonaws.com",begin_url);
                }

            }
            links[i].href=links[i].href.replace(/index\.aspx\?path=/,"roster.aspx?path=");
         //   console.log("Now links["+i+"].href="+links[i].href);
           console.log("links["+i+"].href="+links[i].href);
            /* Check for index */
            for(j=0; j < my_sportresult.length; j++)
            {
                 //console.log("Checking good index with "+begin_url+"sports/"+my_sportresult[j]+"/index\t"+links[i].href);
                if(links[i].href.indexOf(begin_url+"sports/"+my_sportresult[j]+"/index")!==-1 || links[i].href===
                  (url+"sports/"+my_sportresult[j]+"/index"))
                {
                   // console.log("Found good index with "+begin_url+"sports/"+my_sportresult[j]+"/index");
                    found_index=true;
                    new_url=links[i].href;
                }

            }

            if(/athletics\/[^\/]+\/team/.test(links[i].href) && !/athletics\/[^\/]+\/team/.test(url))
            {
                new_url=links[i].href;
                found_good_url=true;
                break;
            }
            
          //  if(url.indexOf("https")===0) links[i].href=links[i].href.replace(/^http:/,"https:");
            let roster_regexp=/\/([^\/]*roster\.html)/i;
            /*if(/team\-roster/.test(links[i].href))
            {
                console.log("Found team roster");
                found_good_url=true;
                new_url=links[i].href;
                break;
            }*/

            if(roster_regexp.test(links[i].href))
            {
                let roster_match=links[i].href.match(roster_regexp);
                console.log("roster_match="+JSON.stringify(roster_match));
                console.log("Found roster 1:"+url.replace(/index\.html/i,roster_match[1])+"\n"+links[i].href);
                if(/index\.html/i.test(url) && url.replace(/index\.html/i,roster_match[1])===links[i].href.replace(/^http:/,"https:"))
                {
                    console.log("Found roster.html");
                    found_good_url=true;
                    new_url=links[i].href;
                    break;
                }
                else
                {
                    console.log("url.replace(/index\.html/i,roster_match[0])===links[i].href="+url.replace(/index\.html/i,roster_match[0])===links[i].href);
                }

            }
            else if(links[i].href.indexOf("/roster")!==-1)
            {
                console.log("\n\nFound ROSTER");
                console.log("my_sportresult="+JSON.stringify(my_sportresult));
                if(links[i].href.indexOf(url)!==-1)
                {
                    new_url=links[i].href;
                        found_good_url=true;
                        break;
                }
                for(j=0; j < my_sportresult.length; j++)
                {


                    let tempRegExp=new RegExp(my_sportresult[j]+"\\/[\\d]+-[\\d]+\\/roster");
                   

                    if(tempRegExp.test(links[i].href) || links[i].href.indexOf("roster.aspx?path="+my_sportresult[j])!==-1 ||
                      links[i].href.indexOf("/"+my_sportresult[j]+"/roster")!==-1



                      )
                    {
                        console.log("Found good roster with tempRegExp ");
                        new_url=links[i].href;
                        found_good_url=true;
                        break;

                       // console.log("Found sportyearroster in links");

                    }
                    else if(/\/roster\/([\d]+)\/([\d]+)/.test(links[i].href))
                    {
                        console.log("roster/#/# success");
                        let the_ul=links[i].parentNode.parentNode.parentNode;
                        //console.log("the_ul="+the_ul+"\t"+the_ul.innerHTML);
                        let mm=the_ul.getElementsByClassName("mmHead");
                        if(i>2)  console.log("links["+(i-2)+"].innerText="+links[i-2].innerText);
                        let roster_sport=links[i].href.match(/\/roster\/([\d]+)\/([\d]+)/);
                        if(( /\/sport\/([\d]+)\/([\d]+)/.test(url)


                            &&
                           roster_sport[2]===url.match(/\/sport\/([\d]+)\/([\d]+)/)[2]) ||

                          (mm.length>0 && i>=2 &&is_good_sport_roster1(mm[0],links[i],links[i-2],roster_sport[1]) ))
                        {
                            console.log("Good again");
                            new_url=links[i].href;

                            found_good_url=true;
                            break;
                        }
                    }

                }
                if(found_good_url) { new_url=links[i].href;  break; }

            }
            else if(/Athletics/i.test(links[i].innerText))
            {
                let athlet_url=links[i].href.replace(/(https?:\/\/[^\/]+).*$/,"$1/");
                if((my_query.try_count===0 || get_domain_only(athlet_url)!==get_domain_only(begin_url)) && !/^(javascript|mailto)/.test(athlet_url)

                  && get_domain_only2(athlet_url)!=="imodules.com"
                  )
                {
                    console.log("\nFound Athletics site="+athlet_url+"\t"+get_domain_only2(athlet_url));
                    found_athletics=true;
                    new_url=links[i].href;
                    if(get_domain_only2(athlet_url)!==get_domain_only2(begin_url) && get_domain_only2(athlet_url)!=="emailmeform.com")
                    {
                        found_good_url=true;
                        break;
                    }
                    
                }

            }
            if(/Roster/i.test(links[i].innerText))
            {
                console.log("Found a roster innertext");
                if(url.indexOf(links[i].href.replace(/\.php$/,""))!==-1)
                {
                    console.log("\nFound real roster");
                    found_good_url=true;
                    new_url=links[i].href;
                    break;
                }
                else if(/\.php$/.test(links[i].href))
                {
                    console.log("Checking php");
                    let url_regex1=/(https?:\/\/[^\/]+)\/([^\/]+)\/([\d]+)\/([\d]+\.php)/;
                    if(url_regex1.test(url))
                    {

                        let temp_url=url.replace(url_regex1,"$1/roster/$3/$4");
                        console.log("fixed link="+links[i].href);
                        if(links[i].href===temp_url)
                        {
                            found_good_url=true;
                            new_url=links[i].href;
                            break;
                        }
                    }
                    else
                    {
                        let temp1=links[i].href.match(/\/([\d]+)\.php$/);

                        
                        if(temp1!==null && sport_map3[my_query.sport.trim()]!==undefined &&
                         parseInt(temp1[1])===sport_map3[my_query.sport.trim()])
                        {
                            console.log("temp1[1]="+parseInt(temp1[1])+"\t"+sport_map3[my_query.sport.trim()]);
                            console.log("Matched sport_map3");
                            found_good_url=true;
                            new_url=links[i].href;
                            break;
                        }
                    }
                }
                let real_short_sport=my_query.sport.replace(/^Men's/,"").replace(/^Women's/,"").trim().toLowerCase();
                console.log("real_short_sport="+real_short_sport);
                var short_regex=new RegExp(real_short_sport,"i");
                if(short_regex.test(links[i].href) && (links[i].href.indexOf("201")===-1 ||links[i].href.indexOf("2018")!==-1))
                {
                    console.log("Found other roster");
                    other_roster_url=links[i].href;
                    found_other_roster=true;
                    if(links[i].href.indexOf("2018")!==-1) {
                        found_good_url=true;
                    new_url=links[i].href;
                    break;
                    }
                }
            }
            if(links[i].innerText.toLowerCase().indexOf(my_query.sport.toLowerCase()+" team")!==-1 && other_roster_url.length===0)
            {
                console.log("Found possible roster");
                other_roster_url=links[i].href;
                    found_other_roster=true;
                    //break;
            }


        }
        console.log("my_query.try_count="+my_query.try_count);
        if(found_other_roster && !found_good_url) { found_good_url=true; new_url=other_roster_url; }
        if(found_athletics && !found_good_url) { found_good_url=true; }
        else if(found_index && !found_good_url) { found_good_url=true; }
        if(my_query.try_count<3 && found_good_url)
        {
            console.log("try_count="+my_query.try_count+", trying again with good url="+new_url);
            my_query.try_count++;
             GM_xmlhttpRequest({ method: 'GET', url: new_url,
                                onload: function(response) { sports_response(response); },

            onerror: function(response) { console.log("Failed new_url"); },
            ontimeout: function(response) { console.log("Failed timeout new_url"); } });

            return;
        }
        else if(my_query.try_count<3)
        {
            var search_str=get_domain_only2(my_query.url) +" athletics ";// -site:.edu";
            const queryPromise = new Promise((resolve, reject) => {
                console.log("Beginning query search for url ");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then)
                .catch(function(val) {
                console.log("Failed query " + val);
            });
            return;
        }
        else
        {
            console.log("Truly failed, returning");
            GM_setValue("bad_count",bad_count+1);
            GM_setValue("returnHit",true);
        }



    }

     function do_finish() {
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit();
        }
    }

    function is_good_sport_roster1(mm,linkrost,linkname,roster_sport1)
    {
        console.log("Doing is_good_sport_roster1");
        console.log("mm="+mm.innerText+", linkname="+linkname.innerText);
        if(!(/^Men/.test(my_query.sport) && !/^Men/.test(mm.innerText)) && !(/^Women/.test(my_query.sport) && !/^Women/.test(mm.innerText))

          && my_query.sport.toLowerCase().indexOf(linkname.innerText.toLowerCase())!==-1
          )
        {
            console.log("Good roster");
            return true;
        }
    }


    function parse_innertable1(table)
    {
        console.log("Doing parse_innertable1");
        var i=0,j,pos=1,k;
        var rows=table.rows;
        var fullname, splithighhome;
        for(k=0; k < rows.length && rows[k].cells[0].getAttribute("colspan")!==undefined && parseInt(rows[k].cells[0].getAttribute("colspan"))>1; k++)
        {
        }
        console.log("k="+k);
        var title_map=assign_title_map(table.rows[k]);
        console.log("title_map="+JSON.stringify(title_map));
        var label, label_text="", cell_text;
        var found_frosh=false;
        var found_name=false;
        var has_year=false,x;
       for(x in title_map)
       {
           console.log("title_map["+x+"]="+title_map[x]);
           if(title_map[x]==="Year") has_year=true;
       }
        for(i=k+1; i < rows.length; i++)
        {
            found_frosh=false;
            if(rows[i].cells.length>0)
            {
                console.log("i="+i+"\t"+rows[i].cells[0].innerText);
            }
            var cells=rows[i].cells;
            fullname="";
            for(j=0; j < cells.length; j++)
            {
                label_text="";
                label=cells[j].getElementsByTagName("span");
                if(label.length>0) label_text=label[0].innerText.trim();
                if(title_map[j]==="Year")
                {

                 //   console.log("cells["+j+"].innerText="+cells[j].innerText.trim());
                    cell_text=cells[j].innerText.trim();
                    if(/:$/.test(cell_text) || cell_text.replace(label_text,"").trim().length>0) cell_text=cell_text.replace(label_text,"").trim();
                    else { console.log("cell_text replace length="+cell_text.replace(label_text,"").trim().length); }


                   console.log("label_text="+label_text+", cell_text="+cell_text);

                    if(/^\s*(Fr|FIRST|Fy|\'21)/i.test(cell_text))
                    {
                        console.log("Found frosh");
                        found_frosh=true;
                        break;
                    }

                }
                else if(title_map[j]==="Full Name") found_name=true;
            }
            if(!found_frosh && has_year) continue;
           // console.log("Actually found frosh");
            for(j=0; j < cells.length; j++)
            {

                label_text="";
                label=cells[j].getElementsByTagName("span");
                if(label.length>0) label_text=label[0].innerText;
                if(title_map[j]!=="Null"&&title_map[j]!=="Homehigh" && title_map[j]!=="Homeparenhigh" &&
                  title_map[j]!=="First" && title_map[j]!=="Last" && title_map[j]!=="Highhome")
                {

                 //   console.log("cells["+j+"].innerText="+cells[j].innerText.trim());
                    cell_text=cells[j].innerText.trim();
                    if(/:$/.test(cell_text) || cell_text.replace(label_text,"").trim().length>0) cell_text=cell_text.replace(label_text,"").trim();

//                    console.log("cell_text="+cell_text);
                    cell_text=cell_text.replace(/\n/g," ").replace(/\s\s+/g," ");
                    document.getElementById(title_map[j]+" #"+pos).value=cell_text;
                }
                else if(title_map[j]==="Highhome")
                {
                    cell_text=cells[j].innerText.replace(label_text,"").trim().replace(/\s\s+/g," ");
                    splithighhome=cell_text.split("/");
                    if(splithighhome.length>1)  document.getElementById("Hometown #"+pos).value=splithighhome[1].trim();
                    document.getElementById("High School #"+pos).value=splithighhome[0].trim();

                }

                else if(title_map[j]==="Homehigh")
                {
                    cell_text=cells[j].innerText.replace(label_text,"").trim().replace(/\s\s+/g," ");
                    splithighhome=cell_text.split("/");

                    document.getElementById("Hometown #"+pos).value=splithighhome[0].trim();
                    if(splithighhome.length>1)  document.getElementById("High School #"+pos).value=splithighhome[1].trim();

                }
                else if(title_map[j]==="Homeparenhigh")
                {
                    cell_text=cells[j].innerText.replace(label_text,"").trim().replace(/\s\s+/g," ");
                   // console.log("homeparenhigh="+cell_text);
                    let the_regex=/([^\(]+)\s+\(([^\)]+)\)/;
                    let highmatch=cell_text.match(the_regex);
                    splithighhome=cell_text.split("/");
                    if(highmatch!==null)
                    {
                        document.getElementById("Hometown #"+pos).value=highmatch[1].trim();
                        document.getElementById("High School #"+pos).value=highmatch[2].trim();
                    }

                }
                else if(title_map[j]==="First")
                {
                    cell_text=cells[j].innerText.replace(label_text,"").trim().replace(/\s\s+/g," ");
                    fullname=cell_text;
                }
                else if(title_map[j]==="Last")
                {
                    cell_text=cells[j].innerText.replace(label_text,"").trim().replace(/\s\s+/g," ");
                    fullname=fullname+" "+cell_text;
                }
                if(fullname.length>0) document.getElementById("Full Name #"+pos).value=fullname.trim();


            }
            pos++;
            if(pos>25) break;
        }
        console.log("Done loop");
        if(document.getElementById("Full Name #1").value.length>0 || found_name)
        {
            do_finish();
            return true;
        }
        else { console.log("Returning false"); return false; }
    }

    function parse_team_rosters(team_roster,url)
    {
        console.log("in parse_team_rosters");
        var item=team_roster.getElementsByClassName("item");


        var i,pos=1,x,result={};
        if(item.length===0) return false;

        for(i=0; i < item.length; i++)
        {
     //       console.log("i="+i+"\titem[i].innerText="+item[i].innerText);
            result={"Full Name":"","Position":"","Year":"","Height":"","Hometown":"","Weight":""};
            if(item[i].getElementsByClassName("player_name").length>0) {
                result["Full Name"]=item[i].getElementsByClassName("player_name")[0].innerText.trim(); }
            if(item[i].getElementsByClassName("player_position").length>0) {
                result["Position"]=item[i].getElementsByClassName("player_position")[0].innerText.trim(); }

            if(item[i].getElementsByClassName("player_height").length>0) {
                result["Height"]=item[i].getElementsByClassName("player_height")[0].innerText.trim(); }
              if(item[i].getElementsByClassName("player_year").length>0) {
                result["Year"]=item[i].getElementsByClassName("player_year")[0].innerText.trim(); }
            if(item[i].getElementsByClassName("player_home").length>0) {
                result["Hometown"]=item[i].getElementsByClassName("player_home")[0].innerText.trim(); }

            if(/^(Fr|Fy|Fi|\'21)/.test(result.Year))
            {
                for(x in result)
                {
                    document.getElementById(x+" #"+pos).value=result[x];
                }
                pos++;
                if(pos>25) break;
            }
        }
        return true;
    }

    function parse_player(containers)
    {
        var i,j,pos=1,result,x,labelText;
        for(i=0; i < containers.length; i++)
        {
            labelText="";
            result={"Full Name":"","Position":"","Year":"","Height":"","Hometown":"","Weight":""};
            if(containers[i].getElementsByClassName("player-name").length>0)
            {
                if(containers[i].getElementsByTagName("span").length>0)
                {
                    labelText=containers[i].getElementsByTagName("span")[0].innerText; }
                result["Full Name"]=containers[i].getElementsByClassName("player-name")[0].innerText.replace(labelText,"").trim(); }
            if(containers[i].getElementsByClassName("position").length>0)
            {
                result["Position"]=containers[i].getElementsByClassName("position")[0].innerText.trim(); }
            if(containers[i].getElementsByClassName("height").length>0)
            {
                result["Height"]=containers[i].getElementsByClassName("height")[0].innerText.trim(); }
            if(containers[i].getElementsByClassName("weight").length>0)
            {
                result["Weight"]=containers[i].getElementsByClassName("weight")[0].innerText.trim(); }
            if(containers[i].getElementsByClassName("class").length>0)
            {
                result["Year"]=containers[i].getElementsByClassName("class")[0].innerText.trim(); }
            if(containers[i].getElementsByClassName("hometown").length>0)
            {
                result["Hometown"]=containers[i].getElementsByClassName("hometown")[0].innerText.trim(); }

            if(/^(Fr|Fy|Fi|\'21)/.test(result.Year))
            {
                for(x in result)
                {
                    document.getElementById(x+" #"+pos).value=result[x];
                }
                pos++;
                if(pos>25) break;
            }


        }
        if(document.getElementById("Full Name #1").value.length>0)
        {
            do_finish();
            return true;
        }
        return false;
    }


    function parse_caption(captions)
    {
        console.log("Doing parse_caption");
        var i,pos=1,inner_table,j;
        var result,x;
        var label,value;
        for(i=0;i<captions.length; i++)
        {
            result={"Full Name":"","Position":"","Year":"","Hometown":""};
            if(captions[i].children.length>2) return false;
            if(captions[i].children[1].getElementsByTagName("table").length===0) return false;

            inner_table=captions[i].children[1].getElementsByTagName("table")[0];
            result["Full Name"]=captions[i].children[0].innerText.trim();
            for(j=0; j < inner_table.rows.length; j++)
            {
                label=inner_table.rows[j].cells[0].innerText.trim();
                value=inner_table.rows[j].cells[1].innerText.trim();
                if(/Pos/i.test(label)) { result["Position"]=value; }
                else if(/Year/i.test(label)) { result["Year"]=value; }
                else if(/Hometown/i.test(label)) { result["Hometown"]=value; }
            }
            if(!/^(Fr|Fy|\'21)/i.test(result.Year)) { console.log("Non-frosh"); continue; }
            for(x in result)
            {
                document.getElementById(x+" #"+pos).value=result[x];
            }
            pos++;
        }
        if(document.getElementById("Full Name #1").value.length>0)
        {
            do_finish();
            return true;
        }
        return false;


    }

    function parse_vcgrid(doc)
    {
        var pos_count=1,i;
        console.log("in parse_vcgrid");
        var vc_grid=doc.getElementsByClassName("vc_grid"),vc_item;
        if(vc_grid.length===0) {
            console.log("No grid");
           return false;
        }
        var name="",position="",hometown="";
        vc_grid=vc_grid[0];
        vc_item=vc_grid.getElementsByClassName("vc_grid-item");
        for(i=0; i < vc_item.length; i++)
        {
            if(vc_item[i].getElementsByClassName("team-roster-name").length>0)
            {
                document.getElementById("Full Name #"+pos_count).value=vc_item[i].getElementsByClassName("team-roster-name")[0].innerText;
            }
            if(vc_item[i].getElementsByClassName("team-roster-position").length>0)
            {
                document.getElementById("Position #"+pos_count).value=vc_item[i].getElementsByClassName("team-roster-position")[0].innerText;
            }
            if(vc_item[i].getElementsByClassName("team-roster-green").length>0)
            {
                document.getElementById("Hometown #"+pos_count).value=vc_item[i].getElementsByClassName("team-roster-green")[0].innerText;
            }

            pos_count++;
            if(pos_count>25) break;
        }
        if(document.getElementById("Full Name #1").value.length>0)
        {
            do_finish();
            return true;
        }
        else return false;
    }


    function parse_athleticsroster(roster,url)
    {
        var i,j,pos=1,result={},x;
        var player=roster.getElementsByClassName("player");
        if(player.length===0) return false;
        var curr_player,curr_text,label,label_text;
        var term_map={"full_name":"Full Name","year_in_school":"Year","height":"Height","weight":"Weight","position":"Position",
                      "hometown":"Hometown","high_school":"High School"};
        var curr_class;
        var found_frosh;
        for(i=0; i < player.length; i++)
        {
            found_frosh=false;
            result={};
            curr_player=player[i]
             for(j=0; j < curr_player.children.length; j++)
            {
                label_text="";
                curr_class=curr_player.children[j].className;
                label=curr_player.children[j].getElementsByTagName("span");
                if(label.length>0) label_text=label[0].innerText.trim();
                curr_text=curr_player.children[j].innerText.trim().replace(label_text,"").trim();
                if(term_map[curr_class]!==undefined && term_map[curr_class]==="Year" &&
                   /^\s*(Fr|FIRST)/i.test(curr_text))
                {
                    found_frosh=true;
                    break;
                }
            }
            if(!found_frosh) continue;
            for(j=0; j < curr_player.children.length; j++)
            {
                label_text="";
                curr_class=curr_player.children[j].className;
                label=curr_player.children[j].getElementsByTagName("span");
                if(label.length>0) label_text=label[0].innerText.trim();
                curr_text=curr_player.children[j].innerText.trim().replace(label_text,"").trim();
                if(term_map[curr_class]!==undefined)
                {
                    result[term_map[curr_class]]=curr_text;
                }
                console.log("curr_text="+curr_text);


            }
            //if(player[i].getElementsByClassName("full_name").length>0)
            for(x in result)
            {
                document.getElementById(x+" #"+pos).value=result[x];
            }
            pos++;
        }
        return true;
    }

    function parse_sportsyearroster(doc,url)
    {
        var i,j;
        console.log("parsing it");
        var pos=1;
        var roster=doc.getElementsByClassName("roster");
        console.log("roster.length="+roster.length);
        if(roster.length===0) return false;
        var table=roster[0].getElementsByTagName("table");
        if(table.length>0) { table=table[0]; }
        else
        {

            var player=roster[0].getElementsByClassName("player");
              console.log("table.length=0,player.length="+player.length);
            if(player.length>0) return parse_sportsyearlist(player,url);
            else return false;

        }
        var header_row=table.getElementsByClassName("roster-header");
        if(header_row.length===0) return false;
        console.log("Moo");
        var title_map=assign_title_map(header_row[0]);
        var rows=table.rows;
        var fullname, splithighhome;
        var label, label_text="", cell_text;
        console.log("BLUUM");
        if(parse_innertable1(table)) return true;
        else
        {
            check_and_submit();
            return true;
        }

//        return true;


    }

    function parse_figure_caption(captions)
    {
        var i,j;
        var pos=1;
        var curr_str,curr_name,curr_year,curr_town;
        var t=0;
        console.log("Parsing figure caption");
        for(i=0; i < captions.length; i++)
        {
            t=0;
            curr_str=captions[i].innerText.split("\n");
            while(curr_str[t].trim().length===0 && t < curr_str.length) t++;
            if(curr_str.length>=3+t && /^(Fr|FIRST)/i.test(curr_str[t+1]))
            {

                if(/[-–]+/.test(curr_str[t]))
                {
                    document.getElementById("Full Name #"+pos).value=curr_str[t].split(/[-–]+/)[1].trim();
                }
                else document.getElementById("Full Name #"+pos).value=curr_str[t];
                document.getElementById("Year #"+pos).value=curr_str[t+1].trim();
                document.getElementById("Hometown #"+pos).value=curr_str[t+2].trim();
                pos++;

            }
            console.log("curr_str="+curr_str);
        }
        if(document.getElementById("Full Name #1").value.length>0)
        {
            check_and_submit();
            return true;
        }
        return false;
    }

    function parse_sportsyearlist(player_list,url)
    {
        console.log("Doing parse_sportsyearlist");
        var begin_url=url.replace(/(https?:\/\/[^\/]+).*$/,"$1/");
        my_query.done_bios=0;
        my_query.total_bios=player_list.length;
        var i,inner_a;
        var pos=1;
        for(i=0; i < player_list.length ; i++)
        {
            inner_a=player_list[i].getElementsByTagName("a")[0].href.replace("https://www.mturkcontent.com",begin_url);
            GM_xmlhttpRequest({ method: 'GET', url: inner_a,
                               onload: function(response) { if(pos<=25) { parse_sportsyearbio(response,pos++); } },

                               onerror: function(response) { console.log("Fail"); },
                               ontimeout: function(response) { console.log("Fail"); } });
        }
        return true;

    }

    function parse_sportsyearbio(response,pos)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        var i;
        var x;
        console.log("response.finalUrl="+response.finalUrl+"\tpos="+pos);
        var table=doc.getElementsByTagName("table");
        if(table.length===0)
        {
            my_query.done_bios++;
            if(my_query.done_bios===my_query.total_bios) do_finish();
            return;
        }
        table=table[0];
        var result={};
        if(doc.getElementsByClassName("name").length>0) {
            result["Full Name"]=doc.getElementsByClassName("name")[0].innerText.trim(); }
        var label="",value="";
        for(i=0; i < table.rows.length; i++)
        {
            label=table.rows[i].getElementsByClassName("label")[0].innerText.trim();
            value=table.rows[i].getElementsByClassName("value")[0].innerText.trim();
            if(/Height:/.test(label)) result["Height"]=value;
            else if(/Year:/.test(label)) result["Year"]=value;
            else if(/Hometown:/.test(label)) result["Hometown"]=value;
            else if(/High School:/.test(label)) result["High School"]=value;
            else if(/Position:/.test(label)) result["Position"]=value;
            else if(/Weight:/.test(label)) result["Weight"]=value;

        }
        if(result["Year"]!==undefined && /^(Fr|FIRST)/i.test(result["Year"]))
        {

            for(x in result)
            {
                document.getElementById(x+" #"+pos).value=result[x];
            }
        }
        my_query.done_bios++;
        console.log("my_query.done_bios="+my_query.done_bios+"\tmy_query.total_bios="+my_query.total_bios);
        if(my_query.done_bios===my_query.total_bios || my_query.done_bios>=25) do_finish();
        return true;
    }

    function parse_dbml(doc)
    {
        var i,j;
        var table=doc.getElementById("roster-list-table");
        var pos=1;
        if(table===null) return false;
        parse_innertable1(table);
        return true;
    }
    /* e.g. roster/0/16.php */
    function parse_numnum(doc)
    {
        console.log("Doing num_num");
        var rosterTable=doc.getElementsByClassName("rosterTable");
//        console.log("rosterTable.length="+rosterTable.length);
        if(rosterTable.length===0)
        {
            console.log("MOO");
            check_and_submit();
            return true;
        }
         //   return false;
        console.log("About to parse inner table");
        return parse_innertable1(rosterTable[0]);
        
    }

    function parse_roster_aspx(doc,finalUrl)
    {
        var i,j,new_url;
        var players_list=doc.getElementsByClassName("sidearm-roster-players");

        if(players_list.length>0)
        {
            console.log("players_list.length="+players_list.length);
            return parse_sidearm_list(players_list[0]);
        }
        else
        {
            console.log("Not players list");
            var roster=doc.getElementsByClassName("roster_dgrd");
            if(roster.length>0 && roster[0].tagName==="TABLE")
            {
                console.log("roster_dgrd");
                return parse_innertable1(roster[0]);

            }
            else if(!my_query.alreadyDoneAspx)
            {
                console.log("alreadydone undefined");

                let past=doc.getElementById("ctl00_cplhMainContent_ddlPastRosters");
                if(past===null) return false;

                var roster_num="";
                console.log("past.tagName="+past.tagName);
                for(i=0; i < past.options.length; i++)
                {
                    console.log("past["+i+"].innerText="+past.options[i].innerText);
                    if(past.options[i].innerText.trim()==="2018")
                    {
                        console.log("past.options["+i+"].value="+past.options[i].value);
                        roster_num=past.options[i].value;
                        break;
                    }
                }
                if(roster_num.length>0)
                {
                    new_url=finalUrl;
                    if(/roster\=[\d]+&/.test(new_url))
                    {
                        new_url=new_url.replace(/roster\=[\d]+&/,"roster="+roster_num);
                    }
                    else {
                        new_url=new_url.replace(/&$/,"")+"&roster="+roster_num;
                    }
                    console.log("finalUrl="+finalUrl+"\tnew_url="+new_url);

                    my_query.alreadyDoneAspx=true;
                    var sport_promise=new Promise((resolve,reject) => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url:    new_url,

                            onload: function(response) {
                                //   console.log("On load in crunch_response");
                                //    crunch_response(response, resolve, reject);

                                sports_response(response, resolve, reject);
                            },
                            onerror: function(response) { reject("Fail"); },
                            ontimeout: function(response) { reject("Fail"); }

                        });
                    });
                }
            }
            return false;
        }
    }

    function parse_sidearm_list(player_list)
    {
        console.log("Doing parse_sidearm_list");
        var i,j,curr_player,curr_name,curr_height,curr_pos,curr_year,curr_town,curr_school,x;
        var curr_fields={};
        //console.log("player_list.innerText="+player_list.innerHTML);
          var label, label_text="";
        var pos=1;
        var list=player_list.getElementsByTagName("li");
        for(i=0; i < list.length; i++)
        {
            console.log("i="+i);
            curr_fields={};
            curr_player=list[i];
            curr_name=curr_player.getElementsByClassName("sidearm-roster-player-name")[0];
            let inner_p=curr_name.getElementsByTagName("p")[0];
            console.log("inner_p.innerText="+inner_p.innerText.trim());

            curr_fields["Full Name"]=inner_p.innerText.trim();
            console.log("Junk");
            if(curr_player.getElementsByClassName("sidearm-roster-player-academic-year").length===0) {
                if(!(curr_player.getElementsByClassName("sidearm-roster-player-custom1").length>0 &&
                   /^\s*(fr|Fi|Fy)/i.test(curr_player.getElementsByClassName("sidearm-roster-player-custom1")[0].innerText.trim())))
                {


                    console.log("Bloo"); continue; }
                else
                {
                    curr_fields["Year"]=curr_player.getElementsByClassName("sidearm-roster-player-custom1")[0].innerText.trim(); }
            }
            else if(
               !/^\s*(fr|FIRST|Fy)/i.test(curr_player.getElementsByClassName("sidearm-roster-player-academic-year")[0].innerText.trim()))
            {
                console.log(curr_player.getElementsByClassName("sidearm-roster-player-academic-year")[0].innerText.trim()+
                            " is NON FRESHMAN continuing");
                continue;
            }
            console.log("Blunk");

            if(curr_player.getElementsByClassName("sidearm-roster-player-position-long-short").length>0) {
                curr_fields["Position"]=curr_player.getElementsByClassName("sidearm-roster-player-position-long-short")[0].innerText.trim(); }
            else {
                curr_fields["Position"]=curr_player.getElementsByClassName("sidearm-roster-player-position")[0].innerText.trim(); }
            console.log("Troo");
            if(curr_player.getElementsByClassName("sidearm-roster-player-height").length>0) {
                curr_fields["Height"]=curr_player.getElementsByClassName("sidearm-roster-player-height")[0].innerText.trim(); }
            if(curr_player.getElementsByClassName("sidearm-roster-player-weight").length>0) {
                curr_fields["Weight"]=curr_player.getElementsByClassName("sidearm-roster-player-weight")[0].innerText.trim(); }
            if(curr_player.getElementsByClassName("sidearm-roster-player-academic-year").length>0) {
                curr_fields["Year"]=curr_player.getElementsByClassName("sidearm-roster-player-academic-year")[0].innerText.trim(); }
            if(curr_player.getElementsByClassName("sidearm-roster-player-hometown").length>0) {
                curr_fields["Hometown"]=curr_player.getElementsByClassName("sidearm-roster-player-hometown")[0].innerText.trim(); }
             if(curr_player.getElementsByClassName("sidearm-roster-player-highschool").length>0) {
                 curr_fields["High School"]=curr_player.getElementsByClassName("sidearm-roster-player-highschool")[0].innerText.trim(); }
            else if(curr_player.getElementsByClassName("sidearm-roster-player-previous-school").length>0) {
                 curr_fields["High School"]=curr_player.getElementsByClassName("sidearm-roster-player-previous-school")[0].innerText.trim(); }

            for(x in curr_fields)
            {
                console.log("x="+x);
                document.getElementById(x+" #"+pos).value=curr_fields[x];
            }
            pos++;
            if(pos>25) break;

        }
        do_finish();
        return true;
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
        GM_setValue("bad_count",bad_count+1);
        GM_setValue("returnHit",true);
        return;

    }

    function query_promise_then(url)
    {
        if(my_query.doneNewUrl) { console.log("Already tried new "); GM_setValue("bad_count",bad_count+1); GM_setValue("returnHit",true); return; }
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

    function assign_title_map(header_row)
    {
        var ret={};
        console.log("Doing assign_title_map "+header_row);
        var i;
        var curr_cell;
        var done_school=false;
        for(i=0; i < header_row.cells.length; i++)
        {
            curr_cell=header_row.cells[i].innerText.toLowerCase().trim();
             // console.log("curr_cell="+curr_cell);
            if(/first name/i.test(curr_cell))
            {
                ret[i]="First";
            }
            else if(/last name/i.test(curr_cell))
            {
                ret[i]="Last";
            }
            else if(curr_cell.indexOf("name")!==-1 || /Player/i.test(curr_cell))
            {
                ret[i]="Full Name";
            }

            else if(curr_cell.indexOf("position")!==-1||/Pos\.?/i.test(curr_cell)) ret[i]="Position";
            else if(curr_cell.indexOf("year")!==-1||/(?:Cl|Yr)(?:\.|\s|$)/i.test(curr_cell)
                   || /class/i.test(curr_cell) || /Experience|Season/i.test(curr_cell)
                   ) ret[i]="Year";
            else if(curr_cell.indexOf("height")!==-1 || /Ht\.?/i.test(curr_cell)) ret[i]="Height";
            else if(curr_cell.indexOf("weight")!==-1 || /Wt\.?/i.test(curr_cell)) ret[i]="Weight";
            else if(/(home\s*town|city)[^\/]*\/\s*.*school/i.test(curr_cell)) ret[i]="Homehigh";
            else if(/.*school[^\/]*\/.*(city|town)/i.test(curr_cell)) ret[i]="Highhome";
            else if(/home\s*town\s*\(.*school\)/i.test(curr_cell)) ret[i]="Homeparenhigh";

            else if(/home\s*town|(^home$)/i.test(curr_cell)) ret[i]="Hometown";

            else if(/Location/i.test(curr_cell)) ret[i]="Hometown";
            else if(/school|(^hs$)/i.test(curr_cell) && !done_school) { ret[i]="High School"; done_school=true; }

            else ret[i]="Null";
        }
        console.log("Done assign_title_map="+JSON.stringify(ret));
        return ret;
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
        var domain_URL=my_query.url.replace(/index\.aspx\?path/,"roster.aspx?path");
          console.log("domain_URL="+domain_URL);
          if(domain_URL.indexOf(".pdf")!==-1) domain_URL=domain_URL.replace(/\/[^\.\/]+\.pdf.*$/,"/");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    domain_URL,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);

             sports_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail "+response); },
            ontimeout: function(response) { reject("Fail "+response); }


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
        GM_xmlhttpRequest({ method: 'GET', url:    search_URIBing,onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
        });
    }

    function init_TaylorFodor()
    {
 //       var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var well=document.getElementsByClassName("well");
        good_count=GM_getValue("good_count",0);
        bad_count=GM_getValue("bad_count",0);
        console.log("Good: "+good_count+"\tBad: "+bad_count);
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
                  doneRedirect: false, doneNewUrl: false, doneCoaches: false, doneSorry: false,
                 alreadyDoneAspx:false};
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
        if(my_query.url.indexOf("google.com")!==-1)
        {
            let url_match=my_query.url.match(/&url=(.*)$/);
            if(url_match!==null) {
                my_query.url=decodeURIComponent(url_match[1]);
                console.log("New url="+my_query.url);
            }
        }

        sport_map1[my_query.sport.trim()].push(my_query.sport.replace(/\'/g,"").replace(/\s/g,"-").toLowerCase());
        console.log("sport_map1="+JSON.stringify(sport_map1));
        console.log("my_query="+JSON.stringify(my_query));

        /*if(my_query.url.indexOf("nwacsports.org")!==-1) {
            check_and_submit();
            return;
        }*/
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