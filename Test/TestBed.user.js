// ==UserScript==
// @name        TestBed
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include     *
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
// @connect http*tryshit.com*
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;





    function create_promise(url, parser, then_func, catch_func)
    {
        if(catch_func==undefined) catch_func=function(response) { console.log("Request to url failed "+response); };
        const queryPromise = new Promise((resolve, reject) => {
            GM_xmlhttpRequest(
                {method: 'GET', url: url,
                 onload: function(response) {
                     var doc = new DOMParser()
                     .parseFromString(response.responseText, "text/html");
                     parser(doc,response.finalUrl, resolve, reject); },
                 onerror: function(response) { reject("Failed to load site "+response); },
                 ontimeout: function(response) {reject("Timed out loading site "+response); }
                });
        });
        queryPromise.then(then_func)
            .catch(catch_func);
        return queryPromise;
    }
    /**
     * adjust_time adjusts the hr, min, ampm into military format */
    function adjust_time(hr,min,ampm)
    {
        var time12=parseInt(hr);
        if(ampm.toLowerCase()==="pm" && time12!==12)
        {
            time12=time12+12;
        }
        else if(ampm.toLowerCase()==="am" && time12==="12") time12=0;
        return ""+time12+":"+min;
    }
    /**
     * parse_hr_match gives that a matched daily hours in FB's format is either CLOSED and if not closed,
     * sets the opening and closing times in military style format for submission
     */
    function parse_hr_match(hr_match) {
        // p1 is nondigits, p2 digits, and p3 non-alphanumerics
        var result={closed:false,open:"",close:""};
        if(hr_match[2]===null||hr_match[2]===undefined)
        {
            result.closed=true; return result;
        }
        result.open=adjust_time(hr_match[2],hr_match[3],hr_match[4]);
        result.close=adjust_time(hr_match[5],hr_match[6],hr_match[7]);
        return result;
    }

    /* parse hours is a helper for parse_FB_about */
    function parse_hours(script)
    {
        var result={};
        var text=script.innerHTML.replace(/^require\(\"TimeSlice\"\)\.guard\(\(function\(\)\{bigPipe\.onPageletArrive\(/,"")
        .replace(/\);\}\).*$/,"")
       // console.log("text="+text);
        text=text.replace(/([\{,]{1})([A-Za-z0-9_]+):/g,"$1\"$2\":").replace(/\\x3C/g,"<");
        //console.log("now text="+text);
        //console.log("text.substring(2365)="+text.substring(2365));
        var parsed_text=JSON.parse(text);
        var instances=parsed_text.jsmods.instances;
        var x,i,j,good_instance,hr_match;
        var hr_regex=/^([A-Za-z]+):\s*(?:CLOSED|([\d]{1,2}):([\d]{2})\s*([A-Z]{2})\s*-\s*([\d]{1,2}):([\d]{2})\s*([A-Z]{2}))/i;
        for(i=0; i < instances.length; i++)
        {
            try
            {
                if(instances[i].length>=3 && instances[i][1].length>0 && instances[i][1][0]==="Menu"
                   && instances[i][2].length>0)
                {

                    good_instance=instances[i][2][0];
                    for(j=0; j < good_instance.length; j++) {
                        console.log("good_instance["+j+"].label="+good_instance[j].label);
                        if(good_instance[j].label!==undefined && hr_regex.test(good_instance[j].label))
                        {
                            hr_match=good_instance[j].label.match(hr_regex);
                            console.log("hr_match at "+j+"="+JSON.stringify(hr_match));
                            result[hr_match[1]]=parse_hr_match(hr_match);

                        }
                    }
                }
            }
            catch(error) { console.log("error with hours "+error); }
           // console.log("typeof(instances["+i+"])="+typeof(instances[i]));
        }
//        console.log("JSON.stringify(instances)="+JSON.stringify(instances));
        return result;

    }
    /**
     * parse_FB_about is a create_promise style parser for a FB about page
     */
    function parse_FB_about(doc,url,resolve,reject)
    {
       // console.time("fb_about");
        //console.log("this="+JSON.stringify(this));
        var result={};
        var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts;
        for(i=0; i < scripts.length; i++)
        {
            if(/^bigPipe\.beforePageletArrive\(\"PagesProfileAboutInfoPagelet/.test(scripts[i].innerHTML) && i < scripts.length-1)
            {
                /* Parse the next one */
                result.hours=parse_hours(scripts[i+1]);
            }
        }
        for(i=0; i < code.length; i++)
        {
            //console.log("code ("+i+")");
            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }
        var about_fields=doc.getElementsByClassName("_3-8j"),inner_field1,text;
        var _a3f=doc.getElementsByClassName("_a3f"); // map with coords
        var coords_regex=/markers=([-\d\.]+)%2C([-\d\.]+)/,coords_match;
        if(_a3f.length>0) {
            coords_match=_a3f[0].src.match(coords_regex);
            if(coords_match)
            {
                result.lat=coords_match[1];
                result.lon=coords_match[2];
            }
        }

        for(i=0; i < about_fields.length; i++)
        {
           //  console.log("about_fields["+i+"].className="+about_fields[i].className);
            inner_field1=about_fields[i].getElementsByClassName("_50f4");
            if(about_fields[i].className.toString().indexOf("_5aj7")!==-1 &&
               about_fields[i].className.toString().indexOf("_20ud")!==-1 &&
                   about_fields[i].getElementsByClassName("_4bl9").length>0)
            {
                //console.log("Found address");
                result.address="";
                let add_fields=about_fields[i].getElementsByClassName("_2iem");
                for(j=0; j < add_fields.length; j++) result.address=result.address+add_fields[j].innerText+",";
                result.address=result.address.replace(/,$/,"");
            }
            if(inner_field1.length===0) continue;
            text=inner_field1[0].innerText;
            if(email_re.test(text)) result.email=text;
            else if(inner_field1[0].parentNode.tagName==="DIV" &&
                    !/_4bl9/.test(inner_field1[0].parentNode.className)) result.url=text;
            else if(/twitter\.com/i.test(text)) result.twitter_url=text;
            else if(/instagram\.com/i.test(text)) result.insta_url=text;
            else if(/pinterest\.com/i.test(text)) result.pinterest_url=text;
            else if(phone_re.test(text)) result.phone=text.match(phone_re)[0];
            else if(/^About$/i.test(text) && about_fields[i].getElementsByClassName("_3-8w").length>0) {
                result.about=about_fields[i].getElementsByClassName("_3-8w")[0].innerText; }


        }
        //console.log("result="+JSON.stringify(result));
        resolve(result);
        //console.timeEnd("fb_about");
    }

    function parse_search_script(script)
    {
        var result={success:true,sites:[]},parsed_text,i,j;
        var text=script.innerHTML.replace(/^require\(\"TimeSlice\"\)\.guard\(\(function\(\)\{bigPipe\.onPageletArrive\(/,"")
        .replace(/\);\}\).*$/,"")
       // console.log("text="+text);
        text=text.replace(/([\{,]{1})([A-Za-z0-9_]+):/g,"$1\"$2\":").replace(/\\x3C/g,"<");
        //console.log("text="+text);
        parsed_text=JSON.parse(text);
        var require=parsed_text.jsmods.require;
        for(i=0; i < require.length; i++)
        {
           // console.log("require[i]="+JSON.stringify(require[i]));
            if(require[i].length>3 && require[i][0]==="ReactRenderer")
            {
                console.log("require[i][3][0].props.results="+JSON.stringify(require[i][3][0].props.results));
                let results_list=require[i][3][0].props.results;
                for(j=0; j < results_list.length; j++)
                {
                    result.sites.push({url:results_list[j].uri,name:results_list[j].text});

                }
            //    if(require[i][3]
            }

        }
        //console.log(JSON.stringify(require));

        return result;
    }

    function parse_FB_search(doc,url,resolve,reject)
    {
       console.log("fb_search url="+url);
        //console.log("this="+JSON.stringify(this));
        var result={success:false};
        var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts;



        for(i=0; i < scripts.length; i++)
        {
           // console.log("scripts["+i+"].innerHTML="+scripts[i].innerHTML);

            if(/^bigPipe\.beforePageletArrive\(\"pagelet_loader_initial_browse_result/.test(scripts[i].innerHTML) && i < scripts.length-1)
            {
                /* Parse the next one */
                result=parse_search_script(scripts[i+1]);
                break;
            }
        }
        resolve(result);
        //console.timeEnd("fb_about");
    }

    function parse_FB_home(doc,url,resolve,reject)
    {
       // console.time("fb_about");
        //console.log("this="+JSON.stringify(this));
        var result={};
        var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts;
        for(i=0; i < scripts.length; i++)
        {

        }
        for(i=0; i < code.length; i++)
        {
            //console.log("code ("+i+")");
            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }
        document.getElementById("content").innerHTML=doc.body.innerHTML;
        document.head.innerHTML=document.head.innerHTML+"\n"+doc.head.innerHTML;

    }

    function parse_FB(doc,url,resolve,reject)
    {
        var scripts=doc.scripts,i,j;
        var code=doc.body.getElementsByTagName("code");
        for(i=0; i < code.length; i++)
        {
            console.log("code ("+i+")");
            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }



        document.getElementById("content").innerHTML=doc.body.innerHTML;
        document.head.innerHTML=document.head.innerHTML+"\n"+doc.head.innerHTML;
        /*
        require("TimeSlice").guard((function(){bigPipe.onPageletArrive({allResources:["qMi9y","iMqf3","HyjG2","xkI4c","P4bjz","3Mfrt","e10Oq","O+TDs","+qnqS","O3/JP","xEeYa","ZvIeY","NjL8M","LEYjV","0Qpka","CDQms","0yKpe","pSHFT","AWhBM","uSqb0","7fo+k","6koA8","fj25a","HyHwq","gOmcE","pNE1x"],displayResources:["qMi9y","iMqf3","HyjG2","xkI4c","P4bjz","3Mfrt","e10Oq","O+TDs","+qnqS","O3/JP","xEeYa","ZvIeY","NjL8M","LEYjV","0Qpka","CDQms","0yKpe","pSHFT","AWhBM","uSqb0","7fo+k","HyHwq","pNE1x"]
        */

        var good_script_regex=/.{0,300}gmail{0,300}/g;///^require\(\"TimeSlice\"\)\.guard/;
        // var good_script_regex=/^[^\{]+\{[^\{]+\{allResources:/;//(\[\"[A-Za-z0-9]+\"(?:,\"[^\"]+\")*\]),displayResources:(\[\"[A-Za-z0-9]+\"(?:,\"[^\"]+\")*\])/;
        var good_script_match;
        var good_count=0;
        //        not sure if this is consistently going to be enough to identify it tho
        for(i=0; i < scripts.length; i++)
        {
            good_script_match=scripts[i].innerHTML.match(good_script_regex);
            if(good_script_match)
            {
                for(j=0; j < good_script_match.length; j++)
                {
                    console.log("good_script_match["+i+"]["+j+"]="+good_script_match[j]);
                }
                // console.log("("+i+"), 1: "+good_script_match[1].length+", 2: "+good_script_match[2].length);
                good_count++;
                if(i>0)
                {
                    console.log("previous script["+(i-1)+"]="+scripts[i-1].innerHTML);
                }
                console.log("script["+i+"]="+scripts[i].innerHTML);

            }
        }
        good_script_match=doc.body.innerHTML.match(good_script_regex);
        if(good_script_match)
        {
            for(j=0; j < good_script_match.length; j++)
            {
                console.log("FULLDOC: good_script_match["+i+"]["+j+"]="+good_script_match[j]);
            }
        }



        console.log("*** good_count="+good_count+" ****\n");
    }

    function parse_promise_then(result)
    {
        console.log("parse_promise_then: result="+JSON.stringify(result));
    }



    function init_Query()
    {
//        var dont=document.getElementsByClassName("dont-break-out")[0].href;
  //      var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
      document.getElementById("rlblock_left").innerHTML="<b>Testing</b>";
        document.getElementById("ads").innerHTML="<div id=\"divReactPortletCSS\"></div>";
        var url="https://swanscreekes.pwcs.edu/staff_directory";
           my_query={loadedScripts:0,totalScripts:0,url:url,job_title:"principal"};
        my_query.staff_path=url.match(/^https?:\/\/[^\/]+/)[0];
        var appendElement=document.getElementById("ads");
       /* GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { find_emails(response,appendElement); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });*/

        var fb_url="https://www.facebook.com/pg/holyfamilyparishpueblo/about/?ref=page_internal";
        var fb_search_url="https://www.facebook.com/oregoncountysheriff/?ref=br_rs";
        var promise_list=[];
        promise_list.push(create_promise(fb_search_url,parse_FB_home,parse_promise_then));
        //promise_list.push(create_promise(fb_url,parse_FB,parse_promise_then));
      /* GM_xmlhttpRequest({method: 'GET', url: fb_url,
            onload: function(response) {
                console.log("\n\n\n***** MOOO ****\n\n\n");
                parse_FB(response); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });*/


	/*var search_str;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/





    }
    if(window.location.href.indexOf("tryshit.com")!==-1)
    {
        init_Query();
    }



})();
