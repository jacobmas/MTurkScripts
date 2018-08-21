// ==UserScript==
// @name         Jane M.
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up Jane M.
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.reddit.com/*
// @include *
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// ==/UserScript==

(function() {
    'use strict';
    var automate=true;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s\/@"\?]+)*)|("[^\?\/]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;

    var my_regexp=/Directory\.aspx/i;

    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var subjects=["math","science","social studies","history","language arts",
                  "english","algebra","grade","teacher","ap","honors","cte","individualized programs",
                 "physical education"];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["elementaryschools.org","facebook.com","cde.ca.gov","century21.com","greatschools.org","zillow.com","schooldigger.com",
                 "publicschoolreview.com","areavibes.com","high-schools.com","trulia.com","redfin.com","chamberofcommerce.com","tripadvisor.com",
                 "en.wikipedia.org","realtor.com","latimes.com","privateschoolreview.com","placekeeper.com","hometownlocator.com","schoolfamily.com",
                 "localschooldirectory.com","apartments.com","ratemyteachers.com","idealist.org","allhighschools.com","niche.com",
                 "nonprofitfacts.com","yelp.com","greatschools.org","dandb.com","mapquest.com","chamberofcommerce.com","needmytranscript.com",
                 "manta.com","patch.com","local.yahoo.com","city-data.com"];

    function check_and_submit()
    {

       console.log("Checking and submitting");
        if(automate)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    function paste_email(e)
    {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        var id_val=e.target.id.substr(0,2);
        var text = ""+e.clipboardData.getData("text/plain");
        text=convert_email(text);
         document.getElementById(e.target.id).value=text;
    }
    function convert_email(text)
    {
        var i;
        var text_re=/\?e\=([\d]+)/;


        var text_match=text.match(text_re);
        if(text_match!==null)
        {

            text=text_match[1];
           // console.log("not null, text="+text);

            var split_text=[];

            for(i=0; i < text.length; i+=4)
            {
                split_text.push(text.substr(i,4));
            }
            var split_text2="";
            /** Probably should fix to take the minimum valued one or something in case it's .k12.XX.us **/
            var x = parseInt(split_text[split_text.length-4]);
            if(parseInt(split_text[split_text.length-3]) < parseInt(split_text[split_text.length-4]))
            {
                x=parseInt(split_text[split_text.length-3])
            }

            for(i=0; i < split_text.length; i++)
            {
                split_text2=split_text2+String.fromCharCode(46+(parseInt(split_text[i])-x)/2);
            }
           // console.log(JSON.stringify(split_text2));
            text=split_text2;
        }
        text=text.replace(/^mailto:/,"");
        return text;
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

    function name_paste_func(text) {
        // cancel paste
        console.log("name text="+text);


        var full_name=parse_name(parse_name_func(text));
        document.getElementById("teamMemberFName").value=full_name.fname;
        document.getElementById("teamMemberLName").value=full_name.lname;

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

    function paste_webpage(e)
    {
       e.preventDefault();
        // get text representation of clipboard
       var text = e.clipboardData.getData("text/plain");
       var total=document.getElementById("00Counselors").value;
        var num_re=/^[\d]+$/;
        var num=0;
        if(!num_re.test(total))
        {
            console.log("num re test failed");
            document.getElementById(e.target.id).value=text;
            return;
        }
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
        console.log("Pasting");

        var text = e.clipboardData.getData("text/plain");
        text=text.replace(/,\s+CPA/,"");
        var id=e.target.id;



        var i,j;
        data_paste_func(text);

    }

    function do_address_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain").replace(/\n/g,",");
       add_address(text);
    }
    function add_address(text)
    {
        var my_add=parseAddress.parseLocation(text.replace(/\n/g,","));
        console.log(JSON.stringify(my_add));
        var city_index=text.indexOf(my_add.city);
        var addline1=my_add.number;
        if(my_add.prefix!==undefined) addline1=addline1+" "+my_add.prefix;
        addline1=addline1+" "+my_add.street;
        if(my_add.type!==undefined) addline1=addline1+" "+my_add.type;
        document.getElementById("addressLine1").value=addline1;

        //+" "+my_add.street+" "+my_add.type;//text.substr(0,city_index).replace(/\s*,\s*$/,"");
        document.getElementById("city").value=my_add.city;
        document.getElementById("stateOrRegion").value=my_add.state;
        document.getElementById("zip").value=my_add.zip;
    }
    function data_paste_func(text) {
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

        name_paste_func(ret.name);
        var title_val="NA";
                var t_low=ret.title.toLowerCase();
        if(t_low.length===0) title_val="NA";

        if(t_low.indexOf("director")!==-1)
        {
            title_val="DF";
        }
        else if(t_low.indexOf("manager")!==-1) title_val="FM";
        else if(t_low.indexOf("vp")!==-1 || t_low.indexOf("Vice")!==-1) title_val="VP";
        else if(t_low.indexOf("chief")!==-1 || t_low.indexOf("cfo")!==-1) title_val="CFO";
        else title_val="Other";


        

        document.getElementById("title").value=title_val;
        if(ret.phone.length>0)
            document.getElementById("phoneNumber").value=ret.phone;
        if(ret.email.length>0)
            document.getElementById("email").value=ret.email;

        return true;

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
        var ret={name:"",email:"",subject:"",phone:"",title:""};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false, found_phone=false;


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
        if(split_comma.length===2 && /[^\s]\s/.test(split_comma[0]))
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
                begin_name=begin_name+" "+split_lines[j+1];
                j=j+1;
            }
            ret.name=parse_name_func(begin_name);
        }
        console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
            found_email=false;
           
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
            else if(!found_phone && phone_re.test(second_part_line))
            {
                console.log("Matched phone");
                ret.phone=second_part_line.match(phone_re)[0];
            }
            else if(second_part_line.trim().length>0 && (curr_line.indexOf("Title:")!==-1 || !has_pasted_title)
                 )
            {
                has_pasted_title=true;
                ret.title=second_part_line.trim();
                console.log("Match title="+ret.title);

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
    function query_search(resolve,reject) {
        var search_str=my_query.name;

        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,
            onload: function(response) { query_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); }, ontimeout: function(response) { reject("Fail"); }
            });
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption,lgb_info;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");


            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                /* GM_setValue("returnHit",true); */
                return;
            }
            else console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("b_url="+b_url);//+", b_url.split("/").length="+(b_url).split("/").length);
                //console.log("b_url.split(\"/\")="+b_url.split("/").length);
                if(!is_bad_url(b_url,bad_urls) && b_url.split("/").length<=5)
                {
                    console.log("Shroo");
                    resolve(b_url);
                    break;

                }

            }

        }
        catch(error)
        {
            console.log("Error "+error);
            /* GM_setValue("returnHit",true); */
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(b1_success)
        {
            console.log("Found a good URL woo");
        }

    }

    function query_promise_then(url) {

        my_query.alt_url=url.replace(/\/$/,"");


        if(my_query.failed_web)
        {
            console.log("Failed and replaced");
             document.getElementsByName("WebAccessible")[0].checked=false;
                document.getElementsByName("WebAccessible")[1].checked=true;
                document.getElementById("NewLink").value=my_query.alt_url;
            GM_setClipboard(my_query.alt_url);
        }
        var new_url=my_query.alt_url+"/Directory.aspx";

        GM_setValue("url",new_url);
    }

    function direct_response1(response,resolve,reject)
    {
    }


    function init_Jane()
    {

        var i,x;
        var dont_break=document.getElementsByClassName("dont-break-out");
        my_query={url: dont_break[1].href, name: dont_break[0].innerText,alt_url:"",failed_web:false};

        GM_setClipboard(my_query.url);

        document.getElementsByName("WebAccessible")[1].addEventListener("click",function() {
            document.getElementsByName("WebAccessible")[0].checked=false;
        });
        document.getElementsByName("WebAccessible")[0].addEventListener("click",function() {
            document.getElementsByName("WebAccessible")[1].checked=false;
        });

        document.getElementsByName("seniorfinance")[0].addEventListener("click",function() {
            document.getElementsByName("seniorfinance")[1].checked=false;
        });
                document.getElementsByName("seniorfinance")[1].addEventListener("click",function() {
            document.getElementsByName("seniorfinance")[0].checked=false;
        });

        document.getElementsByName("WebAccessible")[0].checked=true;
        document.getElementsByName("seniorfinance")[0].checked=true;

        window.scrollTo(0,600);

        document.getElementById("teamMemberFName").addEventListener("paste",do_data_paste);
        document.getElementById("addressLine1").addEventListener("paste",do_address_paste);

        console.log("my_query="+JSON.stringify(my_query));
        //inst_body.removeChild(inst_body.getElementsByClassName("ol")[0]);
       /* for(i=1; i<=10; i++) {
            //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
            var curr_id=(i).toString();
            if(i < 10) curr_id=""+curr_id;
            if(document.getElementById("TeacherName"+curr_id) !== null)
            {
               document.getElementById("TeacherName"+curr_id).addEventListener("paste",do_data_paste);
                document.getElementById("TeacherEmail"+curr_id).addEventListener("paste",convert_email);
            }

        }*/



       const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(resolve, reject);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this " + val); });

        const nextPromise = new Promise((resolve,reject) => {
                                        GM_xmlhttpRequest({
            method: 'GET',
            url:    my_query.url,
            timeout: 4000,
            onload: function(response) { resolve("Success") },
            onerror: function(response) { reject("Fail"); }, ontimeout: function(response) { reject("Fail"); }
            });
        });
        nextPromise.then(function(result) { console.log("Succeeded in loading"); })
            .catch(function(val) {
            console.log("Failed to load "+val); my_query.failed_web=true;
            if(my_query.alt_url.length>0)
            {
                console.log("Setting alt_url");
                document.getElementsByName("WebAccessible")[0].checked=false;
                document.getElementsByName("WebAccessible")[1].checked=true;
                document.getElementById("NewLink").value=my_query.alt_url;
                GM_setClipboard(my_query.alt_url);

            }

        });
        GM_setValue("result","");
        GM_addValueChangeListener("result", function() {
            var ret=GM_getValue("result");
            console.log("MOOOSKINS");
            if(ret.failed!==undefined && ret.failed) { console.log("Done");  document.getElementsByName("seniorfinance")[1].click();
                          check_and_submit(); return; }
            name_paste_func(ret.name);
            var title_val="NA";
            var t_low=ret.title.toLowerCase();
            add_address(ret.address);
            if(t_low.length===0) title_val="NA";

            if(t_low.indexOf("director")!==-1)
            {
                title_val="DF";
            }
            else if(t_low.indexOf("manager")!==-1) title_val="FM";
            else if(t_low.indexOf("vp")!==-1 || t_low.indexOf("Vice")!==-1) title_val="VP";
            else if(t_low.indexOf("chief")!==-1 || t_low.indexOf("cfo")!==-1) title_val="CFO";
            else title_val="Other";




            document.getElementById("title").value=title_val;
            if(ret.phone.length>0)
                document.getElementById("phoneNumber").value=ret.phone;
            if(ret.email.length>0)
                document.getElementById("email").value=ret.email;
            console.log("Success");
            check_and_submit();
        })


    }

    function find_finance()
    {
        try
        {
            var i;
            var finance_test=/(Finance)|(Financial)/i;
            var tab=document.getElementById("tblDirectoryTree");
            var find_qmark=/\?.*$/;
            if(tab===null)
            {
                console.log("Fuck failed");
                GM_setValue("returnHit",true);
                return;
            }
            var inner_a=tab.getElementsByTagName("a");
            for(i=0; i < inner_a.length; i++)
            {
                if(finance_test.test(inner_a[i].innerText) && find_qmark.test(inner_a[i].href))
                {
                    console.log("Success");
                    window.location.href=window.location.href+inner_a[i].href.match(find_qmark)[0];
                    return;
                }
                else
                {
                    console.log(inner_a[i].innerText+" failed " + inner_a[i].href);
                }

            }
            GM_setValue("result",{failed: true});
        }
        catch(error) { GM_setValue("returnHit",true); }
    }

    function direct_then()
    {
    }

    function find_person()
    {
        var finance_test=/(Finance)|(Financial)|(CFO)/i;
        var result={address:"",phone:""};
        var i;
        console.log("IN find_person");
        var add=document.getElementsByClassName("DirectoryNormalText");
        var the_tab=document.getElementById("CityDirectoryLeftMargin").getElementsByTagName("table")[0];
        if(the_tab===undefined)
        {
            GM_setValue("result",{failed: true});
            return;
        }
        if(add.length===0) return;
        result.address=add[0].getElementsByTagName("p")[0].innerText;
        if(add[0].getElementsByTagName("p").length>1)
            result.phone=add[0].getElementsByTagName("p")[1].innerText;
        var j;
        for(i=0; i < the_tab.rows.length; i++)
        {
            console.log("i="+i+"row length="+the_tab.rows[i].cells.length);
            for(j=0; j < the_tab.rows[i].cells.length; j++)
            {
                console.log("("+i+","+j+")="+the_tab.rows[i].cells[j].innerText+", test="+finance_test.test(the_tab.rows[i].cells[j].innerText));
            }
            if(the_tab.rows[i].cells.length>1 && finance_test.test(the_tab.rows[i].cells[1].innerText))
            {
                console.log("Found it");
                result.name=the_tab.rows[i].cells[0].innerText;
                result.title=the_tab.rows[i].cells[1].innerText;
                if(the_tab.rows[i].cells[2].getElementsByTagName("a").length>0)
                {
                    result.email=the_tab.rows[i].cells[2].getElementsByTagName("a")[0].href.replace(/^\s*mailto:\s*/,"");
                }
                else
                {
                    result.email=the_tab.rows[i].cells[2].innerText;
                }
                if(the_tab.rows[i].cells.length>3)
                {
                    result.phone=the_tab.rows[i].cells[3].innerText;
                }
                 GM_setValue("result",result);
                break;

            }
        }



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

            init_Jane();
        }

    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
    {
	/* Should be MTurk itself */

        if(automate)
        {
            setTimeout(function() { btns_secondary[0].click(); }, 10000); }
        GM_setValue("returnHit",false);
       GM_addValueChangeListener("returnHit", function() {
                if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
                  btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
                  )
                {
                    if(automate) {
                        setTimeout(function() { btns_secondary[0].click(); }, 0); }
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
            if(automate) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            console.log("MOO");
            var cboxdiv=document.getElementsByClassName("checkbox");
            if(cboxdiv[0]!==undefined && cboxdiv[0].firstChild!==undefined)
            {
                var cbox=cboxdiv[0].firstChild.firstChild;
                if(cbox.checked===false) cbox.click();
            }
        }

    }
    else if(my_regexp.test(window.location.href))
    {
        GM_setValue("url","");
        GM_addValueChangeListener("url",function() { window.location.href=GM_getValue("url") });
        if(window.location.href.indexOf("?")===-1)
        {
            find_finance();
        }
        else
        {
            find_person();
        }

    }


})();