// ==UserScript==
// @name         ScrapeExec
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape Executive Directors
// @author       Jacob Alperin-Sheriff
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var MTurk=new MTurkScript(20000,200,[],init_Query,"A200E6ESV4H82W");
    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve(b_url);
                return;
            }


        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
    }

    function parse_exec(doc,url,resolve,reject)
    {
       // console.log("doc.body.innerHTML="+doc.body.innerHTML);
    }
    function name_paste(e)
    {
        e.preventDefault();
        var ctrl=document.getElementsByClassName("form-control");
        var text = e.clipboardData.getData("text/plain");
        var id=e.target.id;
        var fullname=MTurkScript.prototype.parse_name(text);
        ctrl[1].value=fullname.fname;
        ctrl[2].value=fullname.lname;
    }

    function do_data_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        data_paste_func(text,e.target);

    }

    function data_paste_func(text, target) {
        console.log("In data paste");
        var ctrl=document.getElementsByClassName("form-control");
        var ret=parse_data_func(text);

        console.log("ret="+JSON.stringify(ret));
        var fullname=MTurkScript.prototype.parse_name(ret.name);
        if(ret.email.length>0) ctrl[0].value=ret.email;
        ctrl[1].value=fullname.fname;
        ctrl[2].value=fullname.lname;
        if(ret.title.length>0) ctrl[3].value=ret.title;


        return true;



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


    function parse_data_func(text)
    {
        var ret={name:"",email:"",phone:"",title:""};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false;

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

        /* Figure out what this was doing criminally bad coding Jacob */
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
            var curr_last=split_lines.length-1;
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
            else if(phone_re.test(second_part_line)) {
                ret.phone=second_part_line.match(phone_re)[0];
            }
            else if(second_part_line.length>10 &&
                    second_part_line.substr(0,10)==="Phone Icon" && phone_re.test(second_part_line.substr(11)))
            {
                ret.phone=second_part_line.substr(11).match(phone_re)[0];
            }
            else if((second_part_line.trim().length>0  && !has_pasted_title) || second_part_line.indexOf("Title:")!==-1)
            {
                if(/^ext/.test(second_part_line))
                {
                    console.log("ext phone");
                    ret.phone=(ret.phone+" "+second_part_line.trim()).trim();
                }
                else
                {
                    has_pasted_title=true;
                    ret.title=second_part_line.replace(/^Title:/,"").trim();
                }
            }
            else
            {
                console.log("curr_line="+curr_line);
            }
        }
        return ret;
    }

    function init_Query()
    {
        var ctrl=document.getElementsByClassName("form-control");
        //ctrl[0].addEventListener("paste",do_data_paste);
        ctrl[1].addEventListener("paste",do_data_paste);
        console.log("in init_query");
        var i;
        //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={url:dont[0].href};
        my_query.url=my_query.url.replace(/.*[^\/]{1}\/www\.(.*)$/,"http://www.$1")
        .replace(/https:\/\/s3\.amazonaws\.com\/mturk_bulk\/hits\/[\d]+\//,"http://www.");
        console.log("my_query="+JSON.stringify(my_query));

        var promise=MTurkScript.prototype.create_promise(my_query.url,parse_exec,query_promise_then);

      /*  var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
                         )
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
    }

})();