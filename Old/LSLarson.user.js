// ==UserScript==
// @name         LSLarson
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Speeds up L.S. Larson
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
// @require https://p5dyncdn1.sharpschool.com/minify/js/resourcelibrary/thirdpartylibrary/jquery-confirm.js
// @require https://p5dyncdn1.sharpschool.com/minify/js/resourcelibrary/reactportlets/reactPortletLoader_After.js
// @require https://p5dyncdn1.sharpschool.com/minify/js/resourcelibrary/reactportlets/reactPortletLoader_Before.js
// @require https://p5dyncdn1.sharpschool.com/bundle/js/vendor.cfcd208495d565ef66e7dff9f98764da.js
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
    var subjects=["math","science","social studies","history","language arts","literature",
                  "english","algebra","grade","teacher","honors","cte","individualized programs",
                 "physical education","chemistry","physics","art","music","biology","special ed"];
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
        var id_val=id.replace(/[A-Za-z]+/,"");
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
            for(i=0; i < split_str.length; i++)
            {
                if(id_int>10) break;
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
        if(!document.getElementById("skip_no").checked ||
           (ret.subject.length>0 &&
           substring_in_strings(subjects,ret.subject)))
        {
            console.log("id_val="+id_val);
            document.getElementById("TeacherName"+id_val).value=ret.name;
            document.getElementById("TeacherEmail"+id_val).value=ret.email;
            if(ret.subject==="") ret.subject="Teacher";
            document.getElementById("Subject"+id_val).value=ret.subject;
            return true;
        }
        return false;

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
        var found_email=false;

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
            else if(to_flip)
            {
                var begin_split=begin_name.split(" ");
                if(begin_split.length===2)
                {
                    begin_name=begin_split[1]+" "+begin_split[0];
                }
                //parse_name(begin_name);
                //begin_name=temp_name.fname+" "+temp_name.lname;
                console.log("** TO FLIP ** "+begin_name);
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
            if(!found_email && second_part_line.trim().length>0 && second_part_line.indexOf("Title:")===-1 && !has_pasted_title
                   && substring_in_strings(subjects, second_part_line.toLowerCase()))
            {
                has_pasted_title=true;
                ret.subject=second_part_line.trim();
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

    function query_response2(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response2\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        var staff_vars=["directory"];
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
                var b_re=/\/(domain|page)\/\d+/i;
                console.log("b_url="+b_url);
                var b_url_short=b_url.replace(/https?:\/\/[^\/]*\/(.*)$/,"$1").replace(/[\-\.\/]/g," ").toLowerCase();
                console.log("\tb_url_short="+b_url_short);
                if(b_url.indexOf("/apps/staff")!==-1 || people_re.test(b_url) || b_re.test(b_url)
                  || substring_in_strings(staff_vars,b_url_short)
                  )
                {
                    console.log("Bloop");
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
        var domain_re=/\/(domain|page)\/\d+/i;
        var load_re=/loadReactPortlets\(\'([^\)\']+)\'\)/;
        var url=response.finalUrl;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("IN faculty_response ");
        if((doc.getElementById("edlio_logo")!==undefined &&doc.getElementById("edlio_logo")!==null)||(/apps\/staff/.test(url) )
          ||(/apps\/staff/.test(url)))

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
        else if(load_re.test(doc.body.innerHTML))
        {
            var load_match=doc.body.innerHTML.match(load_re);
            console.log("load_match="+JSON.stringify(load_match));
            components.addItem("staffDirectorySearch");
            var the_url=response.finalUrl.replace(/(https?:\/\/[^\/]+)\/.*$/,"$1")+load_match[1];
            console.log("the_url="+the_url);
            loadReactPortlets(the_url);
            setTimeout(function() { console.log("components="+JSON.stringify(components)) }, 5000);
        }
        else
        {
            console.log("Found generic");
         //   console.log(doc.body.innerHTML);
            parse_generic(doc, response.finalUrl);
        }

    }

    /* Parse a generic staff page with paragraphs */
    function parse_generic(doc, url)
    {
        var para=doc.getElementsByTagName("p");
        var i;
        var teacher_ctr=1;

        var tables=doc.getElementsByTagName("table");

        /* Try to parse with a table first */
        for(i=0; i < tables.length; i++)
        {

            if(parse_table(tables[i],url)) return;
        }

        for(i=0; i < para.length; i++)
        {

            if(email_re.test(para[i].innerText))
            {
                console.log("para="+para[i].innerText);
                /* Try this one */
                var result=parse_data_func(para[i].innerText);
                console.log("result="+JSON.stringify(result));
                if(result.name.length>0 && result.email.length>0 && result.subject.length>0 && teacher_ctr<=10)
                {
                    document.getElementById("TeacherName"+teacher_ctr).value=result.name;
                    document.getElementById("TeacherEmail"+teacher_ctr).value=result.email;
                    document.getElementById("Subject"+teacher_ctr).value=result.subject;

                    teacher_ctr++;
                }
            }
        }
    }
    function get_column_map(tHead)
    {
        var i,j;
        console.log("tHead.innerText="+tHead.innerText);
        var ret={name:-1,email:-1,title:-1,subject:-1,phone:-1};
        if(tHead.rows.length===0)
        {
            return ret;
        }
        console.log("tHead.rows.length="+tHead.rows.length);
        if(tHead.rows.length>0) console.log("tHead.rows[0].length="+tHead.rows[0].cells.length);
        for(i=0; i < tHead.rows[0].cells.length; i++)
        {
            var curr_inner=tHead.rows[0].cells[i].innerText.toLowerCase();
            console.log("curr_inner="+curr_inner);
            if(/name/.test(curr_inner))
            {
                ret.name=i;
            }
            else if(/position/.test(curr_inner) || /title/.test(curr_inner))
            {
                ret.title=i;
            }
            else if(/e[\-]?mail/.test(curr_inner))
            {
                ret.email=i;
                if(/@[^\.]+\.[^\.\)\(]+/.test(curr_inner))
                {
                    ret.domain=curr_inner.match(/@([^\.]+\.[^\.\)\(]+)/)[0];
                }
            }
            else if(/subject/.test(curr_inner) || /department/.test(curr_inner)) ret.subject=i;
            else if(/phone/.test(curr_inner)) ret.phone=i;
        }
        return ret;

    }
    function is_good_column_map(the_map)
    {
        if('name' in the_map && the_map.name!==-1 &&
           'email' in the_map && the_map.email!==-1 &&
           (('title' in the_map && the_map.title!==-1) ||
            ('subject' in the_map && the_map.subject!==-1)))
        {
            return true;
        }
        return false;
    }


    function parse_table(table, url)
    {
        var i;
        var teacher_map={};
        var the_head=table.tHead;
        var column_map={};
        var curr_id=0;
        /* Fix since some don't do it explicitly */
        if(table.tHead===null) return false;
        column_map=get_column_map(table.tHead);
        console.log("column_map="+JSON.stringify(column_map));
        if(!is_good_column_map(column_map))
        {
            console.log("Bad table");
            return;
        }
        if(table.tBodies.length===0) return false;
        var the_body=table.tBodies[0];
        var good_count=0;
        var curr_name;
        console.log("Starting parse");
        for(i=0; i < the_body.rows.length; i++)
        {
            //console.log("i="+i+", "+the_body.rows[i].innerText);

            curr_name=the_body.rows[i].cells[column_map.name].innerText.trim();
            console.log("curr_name="+curr_name);
            teacher_map[curr_name]=
                {email: the_body.rows[i].cells[column_map.email].innerText.trim(), subject:""};
            if(column_map.domain!==undefined)
                teacher_map[curr_name].email=teacher_map[curr_name].email+column_map.domain;
            if(column_map.subject!==-1) {
                teacher_map[curr_name].subject=the_body.rows[i].cells[column_map.subject].innerText.trim();
            }
            else {
                teacher_map[curr_name].subject=the_body.rows[i].cells[column_map.title].innerText.trim();
            }
            if(curr_name.length>0 && /[A-Za-z]+/.test(curr_name) &&
               teacher_map[curr_name].subject.length>0 &&
               substring_in_strings(subjects, teacher_map[curr_name].subject))
            {
                console.log("curr_name="+curr_name+", "+JSON.stringify(teacher_map[curr_name])+"\n");
                good_count++;
            }
            else
            {
                console.log("Fail " + JSON.stringify(teacher_map[curr_name])+"\n");
                delete teacher_map[curr_name];
            }
        }
        if(good_count>=10)
        {
            var x;
            for(x in teacher_map)
            {
                curr_id++;
                if(curr_id>10) break;

               document.getElementById("TeacherName"+curr_id).value=parse_name_func(x.trim());

                document.getElementById("Subject"+curr_id).value=teacher_map[x].subject.trim();
                document.getElementById("TeacherEmail"+curr_id).value=teacher_map[x].email.trim();
            }
            return true;
        }
        return false;



    }


    function parse_domain(doc, url)
    {
        var curr_id=0;
       // console.log("doc.body.innerText="+doc.body.innerText);
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
            if(substring_in_strings(subjects,title))
            {
                if(curr_id<10)
                {
                    curr_id=curr_id+1;

                    document.getElementById("TeacherName"+curr_id).value=staffname.innerText.trim();
             
                    document.getElementById("Subject"+curr_id).value=title.trim();
                    document.getElementById("TeacherEmail"+curr_id).value=email.trim()
                    //document.getElementById(id_str_prefix(curr_id)+"Ephone").value=phone.trim();
                    //document.getElementById(id_str_prefix(curr_id)+"Furl").value=url.trim();
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
        console.log("parsing edlio");
        var user_info=doc.getElementsByClassName("user-info");
        console.log("user_info.length="+user_info.length
                   );
        console.log("doc.body.innerText="+doc.body.innerText);
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

            console.log("i="+i+",user_info[i]="+user_info[i].innerText);

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
            if(substring_in_strings(subjects,user_position))
            {
                console.log("Found teacher");
                if(curr_id<10)
                {
                    curr_id=curr_id+1;

                    document.getElementById("TeacherName"+curr_id).value=name_elem.fname.trim()+" "+name_elem.lname.trim();
                    document.getElementById("Subject"+curr_id).value=user_position.trim();
                    document.getElementById("TeacherEmail"+curr_id).value=email.trim()
                    
                }


            }
        }
       
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
            '<option value="smith_john">smith_john</option>'+
            '<option value="johnsmith">johnsmith</option>';
            '<option value="j.smith">j.smith</option>';

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

        guess_email_button.addEventListener("click", function() {
            let i;
            var the_domain=email_domain_input.value;
            for(i=1; i <= 10; i++)
            {
                var the_name=parse_name(document.getElementById("TeacherName"+i).value);

                if(email_format_select.value==="jsmith")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.fname.substr(0,1)+the_name.lname+"@"+the_domain;
                }
                else if(email_format_select.value==="smithj")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.lname+the_name.fname.substr(0,1)+"@"+the_domain;
                }
                else if(email_format_select.value==="john.smith")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.fname+"."+the_name.lname+"@"+the_domain;
                }
                else if(email_format_select.value==="smith.john")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.lname+"."+the_name.fname+"@"+the_domain;
                }
                else if(email_format_select.value==="john_smith")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.fname+"_"+the_name.lname+"@"+the_domain;
                }
                else if(email_format_select.value==="smith_john")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.lname+"_"+the_name.fname+"@"+the_domain;
                }
                else if(email_format_select.value==="j.smith")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.fname.substr(0,1)+"."+the_name.lname+"@"+the_domain;
                }
                else if(email_format_select.value==="johnsmith")
                {
                    document.getElementById("TeacherEmail"+i).value=the_name.fname+the_name.lname+"@"+the_domain;
                }
            }
        });

    }
    function init_Larson()
    {

        var i,x;

        var row=document.getElementsByClassName("row");
        var well=row[1].getElementsByClassName("well")[0];
        var well_split=well.innerText.split(":");

        setup_UI();

        my_query={school_name: well_split[1].trim(), city: well_split[2].split(",")[0].trim(), state: well_split[2].split(",")[1].trim()};
      //  GM_setClipboard(my_query.school_name);
        console.log("my_query="+JSON.stringify(my_query));
        //inst_body.removeChild(inst_body.getElementsByClassName("ol")[0]);
        for(i=1; i<=10; i++) {
            //      console.log("fname_"+i+"\t"+document.getElementById("fname_"+i));
            var curr_id=(i).toString();
            if(i < 10) curr_id=""+curr_id;
            if(document.getElementById("TeacherName"+curr_id) !== null)
            {
               document.getElementById("TeacherName"+curr_id).addEventListener("paste",do_data_paste);
                document.getElementById("TeacherEmail"+curr_id).addEventListener("paste",convert_email);
            }

        }
       

        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(resolve, reject);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this " + val); /* GM_setValue("returnHit",true); */ });

        
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

            init_Larson();
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