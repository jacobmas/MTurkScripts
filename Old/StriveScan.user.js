
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
// @include https://worker.mturk.com/*
// @include https://*.reddit.com/*
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
    var automate=false;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s\/@"\?]+)*)|("[^\?\/]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["elementaryschools.org","facebook.com","cde.ca.gov","century21.com","greatschools.org","zillow.com","schooldigger.com",
                 "publicschoolreview.com","areavibes.com","high-schools.com","trulia.com","redfin.com","chamberofcommerce.com","tripadvisor.com",
                 "en.wikipedia.org","realtor.com","latimes.com","privateschoolreview.com","placekeeper.com","hometownlocator.com","schoolfamily.com",
                 "localschooldirectory.com","apartments.com","ratemyteachers.com","idealist.org","allhighschools.com","niche.com",
                 "nonprofitfacts.com","yelp.com","greatschools.org","dandb.com","mapquest.com","chamberofcommerce.com","needmytranscript.com",
                 "manta.com","patch.com","local.yahoo.com"];

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

    var name_paste_func=function(text,id_val) {
        // cancel paste
        console.log("text="+text);
        var to_flip=document.getElementById("flipped_true").checked;
        var split_str,fname,lname;
        var appell={"mr.":0,"mrs.":0,"ms.":0,"miss":0,"dr.":0};
        if(text.indexOf(",") !== -1 )
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
        
        document.getElementById(id_val+"AfirstName").value=fname;
        document.getElementById(id_val+"BlastName").value=lname;

    };

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
        var text = e.clipboardData.getData("text/plain");
        var id=e.target.id;
        var id_val=id.substr(0,2);
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
                    data_paste_func(split_str[i],id_str_prefix(id_int));
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
    var data_paste_func=function(text, id_val) {
        // cancel paste
        //e.preventDefault();
        // get text representation of clipboard
       // var text = e.clipboardData.getData("text/plain");
        var fname="",lname="";
        var i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false;

        var to_flip=document.getElementById("flipped_true").checked;
        for(i=0; i < split_lines_1.length; i++)
        {
            if(split_lines_1[i]!==undefined && split_lines_1[i]!==null)
            {
                split_lines.push(split_lines_1[i]);
            }
        }

        console.log("data_paste_func: "+JSON.stringify(split_lines));
        
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
            name_paste_func(begin_name,id_val);
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
            console.log("\n\tsecond_part_line="+second_part_line+"test="+email_re.test(second_part_line));
            console.log("second part line match="+second_part_line.match(email_re));
            if(email_re.test(second_part_line))
            {
                found_email=true;
                console.log("Matched email");
                document.getElementById(id_val+"Demail").value=second_part_line.match(email_re)[0];
            }
            if(validatePhone(second_part_line)
                     )
            {
                document.getElementById(id_val+"Ephone").value=second_part_line;
            }
            else if(second_part_line.length>10 &&
                    second_part_line.substr(0,10)==="Phone Icon" && validatePhone(second_part_line.substr(11)))
            {
                document.getElementById(id_val+"Ephone").value=second_part_line.substr(11);
            }
            else if(!found_email && second_part_line.trim().length>0 && second_part_line.indexOf("Title:")===-1 && !has_pasted_title)
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
        var search_str=my_query.school_name+" "+my_query.city+" "+my_query.state;

        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,
            onload: function(response) { query_response(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); }, ontimeout: function(response) { reject("Fail"); }
            });
    }
    function CDE_search(resolve,reject) {
        var search_str=my_query.school_name+" "+my_query.city+" "+my_query.state+" site:cde.ca.gov";

        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,
            onload: function(response) { CDE_response(response, resolve, reject); },
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
            if(lgb_info!==null && lgb_info.getElementsByTagName("a").length>0 && lgb_info.getElementsByTagName("a")[0].href.indexOf("mturkcontent.com")===-1 &&
              !is_bad_url(lgb_info.getElementsByTagName("a")[0].href,bad_urls))
            {
                b_url=lgb_info.getElementsByTagName("a")[0].href;
               // b1_success=true;
            }

            else if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                /* GM_setValue("returnHit",true); */
                return;
            }
            else console.log("b_algo.length="+b_algo.length);

            for(i=0; !b1_success && i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("b_url="+b_url);//+", b_url.split("/").length="+(b_url).split("/").length);
                //console.log("b_url.split(\"/\")="+b_url.split("/").length);
                if(!is_bad_url(b_url,bad_urls) && b_url.split("/").length<=5)
                {
                    console.log("Shroo");
                    b1_success=true;
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
            var search_str=my_query.school_name+" staff directory site:"+get_domain_only(b_url);

            console.log("Searching with bing for "+search_str);
            var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URIBing,
                onload: function(response) { query_response2(response, resolve, reject); },
                onerror: function(response) { reject("Fail"); }, ontimeout: function(response) { reject("Fail"); }
            });
            return;
        }
        else
        {
            console.log("No school website exists");
            document.getElementById("00Counselors").value="0, no school website exists";
            check_and_submit();
            return;
//            reject("Nothing found");
        }

    }
    function CDE_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
      //  console.log("in CDE_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption,lgb_info;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");

            b_algo=search.getElementsByClassName("b_algo");


            if(b_algo.length===0)
            {
               // console.log("CDE: b_algo length=0");

                return;
            }
            //else console.log("CDE: b_algo.length="+b_algo.length);

            for(i=0; !b1_success && i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                //console.log("CDE: b_url="+b_url);
                var school_re=/\/schooldirectory\//i;
                if( (b_url.indexOf("SchoolDirectory")!==-1 || b_url.indexOf("schooldirectory")!==-1) && b_url.indexOf("results?")===-1)
                {
                   // console.log("Shroo");
                    b1_success=true;
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

            GM_xmlhttpRequest({
                method: 'GET',
                url:    b_url,
                onload: function(response) { CDE_parse(response, resolve, reject); },
                onerror: function(response) { reject("Fail"); }, ontimeout: function(response) { reject("Fail"); }
            });
            return;
        }
        else
        {
            reject("Nothing found in CDE");
        }

    }
    function CDE_promise_then(stuff) { }
    function CDE_parse(response,resolve,reject)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        try
        {
            var t=doc.getElementsByClassName("table")[0];
            var i;
            for(i=0; i < t.rows.length; i++)
            {
                if(t.rows[i].cells[0].innerText==="Status")
                {
                    /* Done, can add 0 closed and finish */
                    if(t.rows[i].cells[1].innerText==="Closed")
                    {
                        console.log("CLOSED SCHOOL");
                        document.getElementById("00Counselors").value="0, school has closed";
                        check_and_submit();
                        return;
                    }
                    else
                    {
                        console.log("School is "+t.rows[i].cells[1].innerText);
                        resolve("School open");
                        return;
                    }
                }

            }
        }
        catch(error)
        {
            reject("School is not closed");
        }
    }

    function query_response2(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response2\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var people_re=/\/people$/;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                /* GM_setValue("returnHit",true); */
                return;
            }

            for(i=0; i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                var b_re=/\/(domain|page)\/\d+/;
                console.log("b_url="+b_url);
                if(b_url.indexOf("/apps/staff")!==-1 || people_re.test(b_url) || b_re.test(b_url))
                {
                    console.log("Success in finding site\n\n\n");
                    resolve(b_url);
                    return;
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
        /* Try finding counseling page itself */
        var search_str=my_query.school_name+" counseling site:"+get_domain_only(b_url);

            console.log("2End: Searching with bing for "+search_str);
            var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
            GM_xmlhttpRequest({
                method: 'GET',
                url:    search_URIBing,
                onload: function(response) { query_response3(response, resolve, reject); },
                onerror: function(response) { reject("Fail"); }, ontimeout: function(response) { reject("Fail"); }
            });
       // reject("Nothing found");

    }

        function query_response3(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response3\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var people_re=/\/people$/;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                /* GM_setValue("returnHit",true); */
                return;
            }

            for(i=0; i < b_algo.length && i < 6; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("3: b_url="+b_url);
                if(b_url.indexOf("schoolloop.com")!==-1)
                {
                    my_query.counseling=true;
                    resolve(b_url);
                    return;
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
        /* Try finding counseling page itself */

       reject("Nothing found");

    }

    function query_promise_then(url)
    {
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {

                if(!my_query.counseling)
                {
                    faculty_response(response);
                }
                else
                {
                    counseling_response(response);
                }
            },
            onerror: function(response) { /* GM_setValue("returnHit",true); */ }, ontimeout: function(response) { /* GM_setValue("returnHit",true); */ }


            });
    }

    function faculty_response(response)
    {
        var people_re=/\/people$/;
        var domain_re=/\/(domain|page)\/\d+/;
        var url=response.finalUrl;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("IN faculty_response ");
        if((doc.getElementById("edlio_logo")!==undefined &&doc.getElementById("edlio_logo")!==null)|(/apps\/staff/.test(url) ))
        {
            console.log("Found edlio");
            parse_edlio(doc, response.finalUrl);
        }
        else if(people_re.test(url) && doc.getElementsByClassName("views-table").length>0)

        {
            console.log("Found people");
        }
        else if(domain_re.test(url))
        {
            console.log("Found domain");
            parse_domain(doc, response.finalUrl);
        }

    }

    function parse_domain(doc, url)
    {
        var curr_id=0;
        var staff=doc.getElementsByClassName("staff");
        var staffname, staffjob,staffmiddle,staffphone;
        var staff_re=/data\-value\=\"([^\"]+)\"/;
        var rot13email_re=/swrot13\(\'([^\']+)/;
        //swrot13('ynyrknaqre@fj.jrqarg.rqh')
        var staffjob_match;
        var rot13_match;
        var email="",name="",phone="",title="";

        var i,j;
        for(i=0; i < staff.length; i++)
        {
            staffname=staff[i].getElementsByClassName("staffname")[0];
              staffmiddle=staff[i].getElementsByClassName("staffmiddle")[0];
            staffjob_match=staffmiddle.innerHTML.match(staff_re);
            staffphone=staff[i].getElementsByClassName("staffphone")[0];
            //console.log("staffphone="+staffphone.innerText.trim());
            //console.log("staffjob_match="+staffjob_match);
            //console.log("i="+i+", staff="+staff[i].innerText);

            rot13_match=staff[i].innerText.match(rot13email_re);
            if(rot13_match!==null)
            {
                email=swrot13(rot13_match[1]);
            }
            if(staffjob_match!==null)
            {
                title=staffjob_match[1];
            }
            name=parse_name(staffname.innerText.trim());
            console.log("title="+title);
            if(title.toLowerCase().indexOf("guidance")!==-1 || title.toLowerCase().indexOf("counselor")!==-1)
            {
                if(curr_id<20)
                {
                    curr_id=curr_id+1;

                    document.getElementById(id_str_prefix(curr_id)+"AfirstName").value=name.fname.trim();
                    document.getElementById(id_str_prefix(curr_id)+"BlastName").value=name.lname.trim();
                    document.getElementById(id_str_prefix(curr_id)+"Ctitle").value=title.trim();
                    document.getElementById(id_str_prefix(curr_id)+"Demail").value=email.trim()
                    document.getElementById(id_str_prefix(curr_id)+"Ephone").value=phone.trim();
                    document.getElementById(id_str_prefix(curr_id)+"Furl").value=url.trim();
                }
            }

            //console.log("\tstaffname="+staffname.innerText+", staffjob="+staffjob.innerHTML);

        }
    }
    function swrot13(str)
    {
        var ret="",i;
        for(i=0; i < str.length; i++)
        {
            if (/[a-z]/.test(str.charAt(i)))
            {
                var temp=((str.charCodeAt(i)-"a".charCodeAt(0)+13)%26)+"a".charCodeAt(0);
                ret=ret+String.fromCharCode(temp);
            }
            else
            {
                ret=ret+str.charAt(i);
            }
        }
        return ret;
    }


    function counseling_response(response)
    {
        var url=response.finalUrl;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
    }

    function parse_edlio(doc, page_url)
    {
        var user_info=doc.getElementsByClassName("user-info");
        var curr_id=0;
        var i,name_elem,email="",user_position="";
        var phone_num="";
        var user_phone="";

        var footer_info_block=doc.getElementsByClassName("footer-info-block");
        for(i=0; i < footer_info_block.length; i++)
        {
            if(footer_info_block[i].getElementsByClassName("a").length>0)
            {
                phone_num=footer_phone.getElementsByClassName("a")[0].replace(/^.*tel:/,"");
                break;
            }
        }


        for(i=0; i < user_info.length; i++)
        {

            name_elem=parse_name(user_info[i].getElementsByClassName("name")[0].innerText);
            if(user_info[i].getElementsByClassName("email").length>0)
                email=convert_email(user_info[i].getElementsByClassName("email")[0].href);
            if(user_info[i].getElementsByClassName("user-position").length>0)
            {
                user_position=user_info[i].getElementsByClassName("user-position")[0].innerText;
                console.log("user_position="+user_position);
            }
            if(user_info[i].getElementsByClassName("user-phone").length>0)
            {
                var phone_match=user_info[i].getElementsByClassName("user-phone")[0].innerText.match(phone_re);
                if(phone_match!==null) user_phone=phone_match[0];
                else user_phone=phone_num;
            }
            else
            {
                user_phone=phone_num;
            }
            if(user_position.toLowerCase().indexOf("guidance")!==-1 || user_position.toLowerCase().indexOf("counselor")!==-1)
            {
                console.log("Found guidance");
                if(curr_id<20)
                {
                    curr_id=curr_id+1;

                    document.getElementById(id_str_prefix(curr_id)+"AfirstName").value=name_elem.fname.trim();
                    document.getElementById(id_str_prefix(curr_id)+"BlastName").value=name_elem.lname.trim();
                    document.getElementById(id_str_prefix(curr_id)+"Ctitle").value=user_position.trim();
                    document.getElementById(id_str_prefix(curr_id)+"Demail").value=email.trim()
                    document.getElementById(id_str_prefix(curr_id)+"Ephone").value=user_phone.trim();
                    document.getElementById(id_str_prefix(curr_id)+"Furl").value=page_url.trim();
                }


            }
        }
        if(curr_id===0)
        {
            curr_id="0, none listed";
        }
        document.getElementById("00Counselors").value=curr_id;
        check_and_submit();




    }
    function id_str_prefix(num)
    {
        if(num < 10) return "0"+num;
        return ""+num;
    }
    /*
    * Sets up the UI to help copy stuff
    */
    function setup_UI()
    {
        var i;
        var WDC=document.getElementById("WebsiteDataCollection");
        var row=WDC.getElementsByClassName("row");
        var x;
        var my_panel=document.createElement("div");
        my_panel.className="row";
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
        var select_style="margin: 2px 6px 2px 2px";
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
        var flip_button_attr={"style": {"margin": "2px 5px"}, "type": "radio", "name": "is_flipped", "id": "flipped_true", "value": "false"};
        var no_flip_button_attr={"style": {"margin": "2px 5px"}, "type": "radio", "name": "is_flipped", "id": "flipped_false", "value": "true",
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

        WDC.insertBefore(my_panel,row[1]);

    }
    function init_StriveScan()
    {

        var i,x;
        var inst_body=document.getElementById("instructionBody");
        for(i=0; i < 3; i++) inst_body.removeChild(inst_body.firstChild);
        for(i=0; i < 8; i++) inst_body.removeChild(inst_body.firstChild.nextElementSibling);
        var replace_map={"LRNG":"LEARNING","APLD":"APPLIED","INST ":"INSTITUTE ","ACDMY":"ACADEMY",
                        "TECHLGY":"TECHNOLOGY","SCHL":"SCHOOL","SCI ":"SCIENCE ","CHRSTN":"CHRISTIAN","CTR":"CENTER","OCCUP ":"OCCUPATIONAL "};
        var h3=inst_body.getElementsByTagName("h3")[0];
        setup_UI();
        var school_re=/^For ([^a-z]+) in ([A-Z\.\-\s]+), ([A-Z]+)/;
        var school_match;
        school_match=h3.innerText.match(school_re);
        console.log(school_match[1]+"\t"+school_match[2]+"\t"+school_match[3]);
        school_match[1]=school_match[1].replace(/SCH$/,"SCHOOL");
        my_query={school_name: replace_strings(school_match[1], replace_map), city: school_match[2], state: school_match[3], counseling: false};
      //  GM_setClipboard(my_query.school_name);
        console.log("my_query="+JSON.stringify(my_query));
        //inst_body.removeChild(inst_body.getElementsByClassName("ol")[0]);
        for(i=1; i<=20; i++) {
            //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
            var curr_id=(i).toString();
            if(i < 10) curr_id="0"+curr_id;
            if(document.getElementById(curr_id+"AfirstName") !== null)
            {
               document.getElementById(curr_id+"AfirstName").addEventListener("paste",do_data_paste);
                document.getElementById(curr_id+"Demail").addEventListener("paste",convert_email);
            }

        }
        document.getElementById("01Furl").addEventListener("paste", paste_webpage);

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(resolve, reject);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this " + val); /* GM_setValue("returnHit",true); */ });

        if(my_query.state==="CA")
        {
            const CDEPromise = new Promise((resolve, reject) => {
                console.log("Beginning CDE search");
                CDE_search(resolve, reject);
            });
            CDEPromise.then(CDE_promise_then
                           )
                .catch(function(val) {
                console.log("Failed at this " + val); /* GM_setValue("returnHit",true); */ });
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

            init_StriveScan();
        }

    }
    else
    {
	/* Should be MTurk itself */

        if(automate)
        {
            setTimeout(function() { btns_secondary[0].click(); }, 20000); }
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
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();