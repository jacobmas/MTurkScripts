// ==UserScript==
// @name         RobBerridge
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse SEC.gov
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
// @connect sec.gov
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var prop_re=/(Rule 14a\-8)|(proposal[A-Za-z\s]+in writing)|(Shareholder Proposal)|(Stockholder Proposal)|(present a proposal)|(proposals must be submitted)|(submit a proposal)|(inclusion of your proposal)|(proposal to be presented)|(Proposals of shareholders)|(proposals[\sA-Za-z]+stockholders)/i;

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

    function check_function()
    {
	return true;
    }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    function is_bad_name(b_name)
    {
	return false;
    }

    function SEC1(response) {
        var i;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("SEC1 "+response.finalUrl);
        var tableFile2=doc.getElementsByClassName("tableFile2")[0];
        var success=false;
        var next_url="";
        for(i=0; i < tableFile2.rows.length; i++)
        {
            if(tableFile2.rows[i].cells[0].innerText==="DEF 14A")
            {
                next_url=tableFile2.rows[i].cells[1].getElementsByTagName("a")[0].href;
                next_url=next_url.replace(/https?:\/\/[^\/]*\//,"https://www.sec.gov/");
                success=true;
                break;
            }
        }
        if(success)
        {
            GM_xmlhttpRequest({
                method: 'GET',
                url:    next_url,

                onload: function(response) {
                    //   console.log("On load in crunch_response");
                    //    crunch_response(response, resolve, reject);
                    SEC2(response);
                },
                onerror: function(response) { console.log("Fail1"); },
                ontimeout: function(response) { console.log("Fail1"); }


            });
            return;

        }
        else
        {
            console.log("Failed in SEC1");
             document.getElementById("web_url").value="NA";
            check_and_submit(check_function, automate);
            return;
        }


    }

    function SEC2(response) {
        var i;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("SEC2 "+response.finalUrl);
        var tableFile=doc.getElementsByClassName("tableFile")[0];
        var success=false;
        var next_url="";
        for(i=0; i < tableFile.rows.length; i++)
        {
            if(tableFile.rows[i].cells[2].innerText.indexOf("htm")!==-1)
            {
                var inner_a=tableFile.rows[i].cells[2].getElementsByTagName("a")[0];
                next_url=inner_a.href.replace(/https?:\/\/[^\/]*\//,"https://www.sec.gov/");
                console.log("next_url in SEC2="+next_url);
                success=true;
                break;
            }
        }
        if(success)
        {
            GM_xmlhttpRequest({
                method: 'GET',
                url:    next_url,

                onload: function(response) {
                    //   console.log("On load in crunch_response");
                    //    crunch_response(response, resolve, reject);
                    SEC3(response);
                },
                onerror: function(response) { console.log("Fail1"); },
                ontimeout: function(response) { console.log("Fail1"); }


            });
            return;
        }
        else
        {
            console.log("Failed in SEC2");
        }
    }

    function get_by_sentence(text)
    {

        var split_text=text.split(". ");
        var i,j;
        var ret="",temp_ret="";
        var curr_str="";
        var pos=0, new_pos=0,temp_pos;
        var period_pos=0;

        console.log("Done");

        console.log("\n\n**** split_text="+JSON.stringify(split_text)+"\n\n");
       var the_pos;
        var regexes=[/without inclusion[A-Za-z0-9\s]+proposal/i,/not\s*(to)?\s*be included[A-Za-z0-9\s\']+proxy/i,/outside of the process/i];
        for(i=0; i < split_text.length; i++) {
            curr_str=split_text[i];
            if(split_text[i].indexOf("30 days")!==-1)
            {
                the_pos=split_text[i].indexOf("30 days");
                curr_str=curr_str.substr(0,the_pos);
            }
            for(j=0; j < regexes.length; j++)
            {
                if(regexes[j].test(curr_str))
                {
                    the_pos=curr_str.match(regexes[j]).index;
                    curr_str=curr_str.substr(0,the_pos);
                }
            }



            temp_ret=get_the_date(curr_str,1);

            if(temp_ret!=="")
                console.log("split_text["+i+"]="+split_text[i]+", temp_ret="+temp_ret);
            if(temp_ret!==null && temp_ret.length>0) ret=temp_ret;

        }
        return ret;
    }
    function get_the_date(text, depth)
    {
        var by_sentence;
        if(depth===undefined || depth!==1)
        {

           by_sentence=get_by_sentence(text);
 console.log("by_sentence="+by_sentence);
            if(by_sentence.length>0)
           {

               return by_sentence;
           }
        }
        else if(!prop_re.test(text)) return "";
        if(!/(submitted(\s[^\s]+){0,2} for inclusion)|(to\ssubmit\sproposals\sfor\sinclusion)|(intended\s+for\s+inclusion)|(considered\s+for\s+inclusion)|(order\s+to\s+be\s+included)|(consider\s+including)/i.test(text))
        {
            console.log("WOOMPIM");
            return "";
        }

        var date_re=/((January)|(February)|(March)|(April)|(May)|(June)|(July)|(August)|(September)|(October)|(November)|(December))\s+\d{1,2},\s*\d{4}/g;
        var my_match=text.match(date_re);
        var date_array=[];
        var temp_date;
        var i;
        if(my_match!==null)
        {
           // console.log("my_match="+JSON.stringify(my_match));
            for(i=0; i < my_match.length; i++)
            {
                temp_date=new Date(my_match[i]);
                if(temp_date.getFullYear()>2018 || (temp_date.getFullYear()===2018 && temp_date.getMonth()>=6))
                {
                    date_array.push(temp_date);
                }
                else
                {
                    console.log("MOOOSSHOFSDA");
                }
            }
            if(date_array.length===0) { return ""; }

        }
        else
        {
            console.log("No dates found");
            return "";
        }
        //date_array.sort();

        console.log("Dates: "+JSON.stringify(date_array));
        var last=date_array.length-1;
        console.log("last "+date_array[last].toLocaleString('en-US').replace(/,.*$/,""));
        return date_array[last].toLocaleString('en-US').replace(/,.*$/,"");

    }


    function SEC3(response) {
        var i,j;
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("SEC3, url="+response.finalUrl);
        var text=doc.getElementsByTagName("text")[0];
        //console.log("text.innerText="+text.innerText);
        do_SEC3(text,0);
        if(!my_query.submitted)
        {
            console.log("Failed to submit");
            GM_setValue("returnHit",true);

        }

    }

    function do_SEC3(docpart, depth)
    {
        //console.log("**** DOING SEC, depth="+depth);
        var i;

                var children=docpart.children;
        for(i=0; i < children.length; i++)
        {
            //console.log("children["+i+"]="+children[i]);
            if(prop_re.test(children[i].innerText))
            {
                console.log("("+depth+","+i+"), reg expression matched, ");
            }
            if(children[i].tagName==="TABLE")
            {
                //console.log("("+depth+","+i+"), table found, continuing");
              //  continue;
            }
            else if(children[i].getElementsByTagName("table").length>0)
            {
             //   console.log("("+depth+","+i+"), found table internal");
                if(depth<6 && children[i].tagName!=="FONT")
                {
                   // console.log("children["+i+"].tagName="+children[i].tagName);
                    do_SEC3(children[i],depth+1);
                    continue;
                }
                else return;
            }
            if(prop_re.test(children[i].innerText))
            {
                console.log("Prop_Re ("+i+"));//, "+children[i].innerText);
                var the_date=get_the_date(children[i].innerText,0);
                console.log("the_date="+the_date);
                if(the_date.length>0 && !my_query.submitted)
                {
                    my_query.submitted=true;
                    document.getElementById("web_url").value=the_date;
                    check_and_submit(check_function, automate);
                    return;
                }
            }
        }
        //console.log("No date found in SEC3");
    }



    function init_Query()
    {

       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={ticker: wT.rows[0].cells[1].innerText, submitted: false};
        var search_str="https://www.sec.gov/cgi-bin/browse-edgar?CIK="+encodeURIComponent(my_query.ticker)+"&owner=exclude&action=getcompany&Find=Search";
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_str,

            onload: function(response) {
                //   console.log("On load in crunch_response");
                //    crunch_response(response, resolve, reject);
                SEC1(response);
            },
            onerror: function(response) { console.log("Fail1"); },
            ontimeout: function(response) { console.log("Fail1"); }


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

            init_Query();
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