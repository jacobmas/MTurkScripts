// ==UserScript==
// @name         JennaKleine2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
    var bad_urls=[".facebook.com","schooldigger.com","elementaryschools.org","www.ratemyteachers.com","www.greatschools.org",
                 "www.publicschoolreview.com","www.zillow.com",".linkedin.com","localschooldirectory.com","www.schoolfamily.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function() { return true;  }
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

    function parse_school(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
                var ctrl=document.getElementsByClassName("form-control");
        console.log("in parse_school\n"+response.finalUrl);
        var text=doc.body.innerText;
      // console.log("text="+text);
        var str1="((?:(?:Assistant|Asst[\\.]?|Vice)\\s+)?Principal):?";
        var bad_words="([^\\s ]+\\s+|-\\s+)";
        var name_str="(?:(?:"+my_query.first+" "+my_query.last+")|(?:"+my_query.last+",?\\s*"+my_query.first+"))";
        var regex1=new RegExp(name_str+"(?:,|\\s*)\\s*"+bad_words+"{0,4}?"+str1);//+str1);
         var regex2=new RegExp(str1+"\\s*("+bad_words+"{0,3}?)"+name_str);//my_query.first+"\\s+"+my_query.last);//+str1);
        var regex3=new RegExp(str1);
        console.log("regex1="+regex1+"\nregex2="+regex2);
        var match1,match2,match3;
        match1=text.match(regex1);
        match2=text.match(regex2);
        match3=text.match(regex3);
        if(match1)
        {
            ctrl[0].value="Yes";
            ctrl[1].value=match1[2];
            check_and_submit(check_function);
        }
        else if(match2)
        {


            console.log("match2="+JSON.stringify(match2));
             ctrl[0].value="Yes";
            ctrl[1].value=match2[1];
            check_and_submit(check_function);

        }
        else if(match3)
        {
            console.log("match3="+JSON.stringify(match3));
            ctrl[0].value="No";
            ctrl[1].value="";
            check_and_submit(check_function);
        }


    }

    function parse_nysed(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_nysed\n"+response.finalUrl);
       var det=doc.getElementsByClassName("contact-details");
        var i;
        var ctrl=document.getElementsByClassName("form-control");
        for(i=0; i < det.length; i++)
        {
            console.log("det["+i+"]="+det[i].innerText);
            let text=det[i].getElementsByTagName("h4")[0].innerText.toLowerCase();
            console.log("text="+text);
            let name_text="MORON BMRORONODY";
            let name_match=false;
            let type_text="";
            let fullname=parse_name(name_text);
            try
            {
                name_text=text.match(/:\s*(.*)$/)[1];
                type_text=text.match(/(^[^:]+):/)[1];
                name_match=true;
                fullname=parse_name(name_text);
                console.log("fullname="+JSON.stringify(fullname));

            }
            catch(error) { console.log("Nysed error="+error); }
            if(name_match && my_query.last.toLowerCase()===fullname.lname.toLowerCase() &&
               my_query.first.length>0 && fullname.fname.length>0 &&
               fullname.fname.toLowerCase().charAt(0)===my_query.first.toLowerCase().charAt(0))
            {
                console.log("Success in nysed");

                ctrl[0].value="Yes";
                ctrl[1].value=type_text;
                check_and_submit(check_function);
                return;

            }

        }
  ctrl[0].value="No";
            ctrl[1].value="";
            check_and_submit(check_function);

    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,lgb_info;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            if(lgb_info!==null)
            {
/*
                inner_a=lgb_info.getElementsByTagName("a");

                console.log("Glunk "+lgb_info.innerHTML+"\n"+inner_a);
                if(inner_a.length>0 && !is_bad_url(inner_a[0].href,bad_urls,-1))
                {
                    console.log("chunk");
                    call_school(inner_a[0].href,parse_school,resolve,reject);
                    return;
                }*/
            }
	    

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

                if(/nysed\.gov\/profile\.php/.test(b_url))
                {
                    GM_xmlhttpRequest({method: 'GET', url: b_url,
                                       onload: function(response) { parse_nysed(response, resolve, reject); },
                                       onerror: function(response) { reject("Fail"); },
                                       ontimeout: function(response) { reject("Fail"); }
                                      });
                    return;
                }

                if(my_query.state.toUpperCase()!=="NY" && !is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
            call_school(b_url,parse_school,resolve,reject);


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
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    function call_school(url,callback,resolve,reject)
    {
        GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
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


    function paste_title(e)
    {
        e.preventDefault();
        // get text representation of clipboard
        var text = e.clipboardData.getData("text/plain");

        console.log("MOOO");
        if(/Principal|Director|Dean/i.test(text))
        {
             e.target.value=text;
           document.getElementsByClassName("form-control")[0].value="Yes";
        }
        else
        {
             e.target.value="";
           document.getElementsByClassName("form-control")[0].value="No";
        }
    }


    function init_Query()
    {
       // var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={school:wT.rows[1].cells[1].innerText, city:wT.rows[2].cells[1].innerText,
                 state:wT.rows[3].cells[1].innerText,
                 first:wT.rows[4].cells[1].innerText,
                 last:wT.rows[5].cells[1].innerText};
        my_query.school=my_query.school.replace(/\sAve\s/i," Avenue ");
        if(state_map[my_query.state]!==undefined) my_query.state=state_map[my_query.state];
        var ctrl=document.getElementsByClassName("form-control"),i;
        for(i=0; i < ctrl.length; i++) ctrl[i].required=false;

        ctrl[1].addEventListener("paste",paste_title);


	var search_str=my_query.school+" "+reverse_state_map[my_query.state.toUpperCase()]+" "+my_query.first+" "+my_query.last;
        if(my_query.state.toUpperCase()==="NY")
        {
            search_str=my_query.school+" site:nysed.gov "+my_query.first+" "+my_query.last;
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





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
