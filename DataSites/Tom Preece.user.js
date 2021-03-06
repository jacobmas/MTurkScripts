// ==UserScript==
// @name         Tom Preece
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  parsing https://beta.companieshouse.gov.uk
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
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
     var my_query = {};

    console.log("MOO");
    //var MTurk=new MTurkScript(20000,0,[],init_Query);

    function get_postal(address) {
        var ret={},zip,match;
        var regex=/([^,]*)$/;
        if(match=address.match(regex)) { return match[0].trim(); }
        return "";

    }

    function parse_address(address) {
        var ret={},zip,match;
        address=address.replace(/(United Kingdom|England|Scotland|Wales),/,"");
        var regex=/([^,]+),([^,]+)$/;
        if((match=address.match(regex)) &&
          !/United Kingdom|England|Scotland|Wales/.test(match[1])
          ) { return {postalCode:match[2].trim(),region:match[1].trim()} }
        else console.log("### address="+address);
        return ret;
    }

    function check_function() {
        if(document.getElementById("sic").value==="00000") return false;

        return true;  }
    function check_and_submit(check_function)
    {
        console.log("in check");
      
        console.log("Checking and submitting");
	if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }

    function is_bad_name(b_name)
    {
        var temp_b=MTurkScript.prototype.shorten_company_name(b_name).toLowerCase().replace(/\s&\s/," and ").replace(/[\s\.\,\&\-\']+/g,"")
        .replace(/Ltd\s.*$/i,"");
        var temp_short=my_query.short_name.toLowerCase().replace(/[\s\.\,\&\-\']+/g,"");
        console.log("temp_b="+temp_b+", temp_short="+temp_short);
        if(temp_b.indexOf(temp_short)!==-1 || temp_short.indexOf(temp_b)!==-1) return false;
        return true;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var results=doc.getElementById("results"),inner_li,temp_add,inner_p,j;
        if(!results && my_query.try_count===0 && /s$/.test(my_query.short_name) && !/\s/.test(my_query.short_name))
        {
            my_query.try_count++;
            my_query.short_name=my_query.short_name.replace(/s$/,"");
            let search_str=my_query.short_name;
            query_search(search_str, resolve, reject, query_response);
            return;
        }
        else if(!results)
        {
            document.getElementById("sic").value="00000";
        document.getElementById("web_url").value=response.finalUrl;
        check_and_submit(check_function);
        //reject("Could not find good name");
        return;

        }
        inner_li=results.getElementsByClassName("type-company");
        var inner_a=results.getElementsByTagName("a"),i,crumbtrail;
        for(i=0; i < inner_li.length; i++)
        {
            console.log("inner_li["+i+"]="+inner_li[i].innerText);
            inner_a=inner_li[i].getElementsByTagName("a")[0];
            crumbtrail=inner_li[i].querySelectorAll(".crumbtrail");
            inner_p=inner_li[i].getElementsByTagName("p");
            temp_add=inner_p[inner_p.length-1].innerText;
            if((!is_bad_name(inner_a.innerText) ||


               (inner_li[i].getElementsByTagName("span").length>0 &&
                !is_bad_name(inner_li[i].getElementsByTagName("span")[0].innerText)))&&crumbtrail.length>0)
            {
                console.log("inner_a="+inner_a);
                for(j=0;j<crumbtrail.length;j++) {
                    var match1=crumbtrail[j].innerText.trim().match(/^[A-Z\d]{8}/);
                    if(match1) { resolve({num:match1[0],add:temp_add});
                                return; }
                }

                return;
            }
        }
        if(my_query.try_count===0 && my_query.short_name.split(" ").length>=3 && !/The$/i.test(my_query.short_name.replace(/\s[^\s]*$/,"")))
        {
            my_query.try_count++;
            my_query.short_name=my_query.short_name.replace(/\s[^\s]*$/,"");
            let search_str=my_query.short_name;
            query_search(search_str, resolve, reject, query_response);
            return;
        }

        
        reject("Could not find good name");
        return;

    }


    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with companyhouse for "+search_str);
        var search_URI='https://beta.companieshouse.gov.uk/search/companies?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URI,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        console.log("Resolved on result="+result);
        document.getElementById("comp_house_no").value=result.num;
        var postalCode=get_postal(result.add).trim();
        var parsedAddress=parse_address(result.add);
        if(postalCode===my_query.postalCode) document.getElementById("comment").value="NameAddressMatch";
        else if(parsedAddress.region===my_query.parsed_address.region) document.getElementById("comment").value="NameMatchRegion";
        else if(postalCode.substr(0,2)===my_query.postalCode.substr(0,2)) document.getElementById("comment").value="NameMatchRegion";
        else document.getElementById("comment").value="NameOnlyMatches";
        check_and_submit(check_function);
    }

   

    function init_Query()
    {
     var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:wT.rows[0].cells[1].innerText,short_name:MTurkScript.prototype.shorten_company_name(wT.rows[0].cells[1].innerText)
                 .replace(/\s&\s/," and ").replace(/\s*(Group|House)$/,"").trim(),try_count:0,
                 address:wT.rows[1].cells[1].innerText};

        my_query.postalCode=get_postal(my_query.address);
        my_query.parsed_address=parse_address(my_query.address);
        
       my_query.short_name=my_query.short_name
        .replace(/\s(Serv[a-z]*s)$/,"")
           .trim();
console.log("my_query="+JSON.stringify(my_query));
	var search_str=my_query.short_name;//.replace(/\s/g,"+");
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





    }

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
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
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
