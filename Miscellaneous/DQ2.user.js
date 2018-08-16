// ==UserScript==
// @name         DQ2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape VINs
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include http*
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

    function query_response(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }
           
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;



                if(!is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
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
            onerror: function(response) { },
            ontimeout: function(response) { }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {


    }





    function init_Query()
    {

       //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        my_query={name: dont[0].innerText, url: dont[1].innerText};
        if(my_query.url.indexOf("http")===-1 && my_query.url.indexOf("www")===-1) { my_query.url="http://www."+my_query.url; }
        else if(my_query.url.indexOf("http")===-1) { my_query.url="http://"+my_query.url; }
        console.log("my_query.url="+my_query.url);
        GM_setValue("my_query","my_query");
	var search_str;
        GM_setValue("VIN_result","");
        GM_addValueChangeListener("VIN_result",function() {
            console.log("Value change for VIN result");
            var result=GM_getValue("VIN_result");
            console.log("result="+JSON.stringify(result));
            if(result.vin_str!==undefined && result.vin_str.length>0)
            {

                document.getElementById("websiteVINs").value=result.vin_str;
            }
            else if(result.vinsUnavailable!==undefined)
            {
                document.getElementsByName("vinsUnavailable")[0].value=result.vinsUnavailable;
            }
            console.log("Done");
            check_and_submit(check_function,automate);
        });
        GM_setValue("curr_site",my_query.url);
     /*   const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/





    }
    /* Figure out site, then parse */
    function do_autos()
    {
        var result={vinsUnavailable:""};
        console.log("Doing autos");
        if(is_automanager())
        {
            console.log("Automanager");
            if(window.location.href.indexOf("view-inventory")===-1)
                GM_setValue("curr_site",window.location.href.replace(/(https?:\/\/[^\/]*)\/?$/,"$1/view-inventory"));
            else do_automanager();
        }
        else if(is_carsforsale() || is_carsforsale2())
        {
            result.vinsUnavailable="Reason4";
            GM_setValue("VIN_result",result);
            return;
        }
        else if(window.location.href.indexOf("https://www.cars.com/")!==-1)
        {
         result.vinsUnavailable="Reason3";
            GM_setValue("VIN_result",result);
            return;
        }

        else if(window.location.href.indexOf(".hasyourcar.com")!==-1)
        {
            if(window.location.href.indexOf("/Inventory")===-1) GM_setValue("curr_site",window.location.href.replace(/(https?:\/\/[^\/]*)\/?$/,"$1/Inventory"));
            else do_hasyourcar();
        }
        else if(is_waynereaves())
        {
            if(window.location.href.indexOf("/inventory")===-1) GM_setValue("curr_site",window.location.href.replace(/(https?:\/\/[^\/]*)\/?$/,"$1/inventory"));
            else do_waynereaves();
        }
        else if(is_autocorner()) do_autocorner();
        else
        {
            console.log("Search hrefs");
            var hrefs=document.getElementsByTagName("a");
            var i1;
            for(i1=0; i1 < hrefs.length; i1++)
            {
                //console.log("hrefs["+i1+"].href="+hrefs[i1].href);
                if(hrefs[i1].href.indexOf("https://www.carbase.com")!==-1)
                {
                    if(window.location.href.indexOf("/used-inventory")===-1)
                    {
                        GM_setValue("curr_site",window.location.href.replace(/(https?:\/\/[^\/]*)\/?$/,"$1/used-inventory?PageNumber=1&SortBy=1&PageSize=100"));
                    }
                    else do_carbase();

                    return;
                }
            }

            console.log("not recognized, trying ");
            var count=0;
            var vin_re=/VIN\s*[#:]{0,2}\s*[\w]{17}/ig;
            var vin_re2=/VIN\s*[#:]{0,2}\s*([\w]{17})/i;
            var vin_match=document.body.innerText.match(vin_re);
            if(vin_match!==null && vin_match.length>0)
            {
                var new_vin;
                var i;
                var my_result={vin_str:""};
                var j;
                for(j=0; j < vin_match.length; j++)
                {
                    var my_match=vin_match[j].match(vin_re2);
                    if(my_match!==null && my_match[1]!==undefined)
                    {
                        count++;
                        new_vin=my_match[1];
                        if(my_result.vin_str.length>0) my_result.vin_str=my_result.vin_str+",";
                        my_result.vin_str=my_result.vin_str+new_vin;
                    }
                }
                console.log("Added "+count+"VIN(s)");
                GM_setValue("VIN_result",my_result);
            }

        }
    }

    function do_carbase()
    {
        console.log("doing carbase");

        var new_vin;
        var i;
        var result={vin_str:""};
        var table=document.getElementsByClassName("table");
        for(i=0; i < table.length;i++)
        {
          //  console.log("i="+i+", detail_item[i].innerText="+detail_item[i].innerText);
            new_vin=table[i].rows[0].cells[3].innerText;
            if(new_vin.length===17)
            {
                if(result.vin_str.length>0) result.vin_str=result.vin_str+",";
                result.vin_str=result.vin_str+new_vin;
            }
        }
        GM_setValue("VIN_result",result);
    }

    function do_waynereaves()
    {
        console.log("Doing wayne reaves");
        var vin_re=/VIN\s*[:]?\s*([\w]*)/;
        var vin_match;
        var i;
        var result={vin_str:""};
        var detail_item=document.getElementsByClassName("detail-item");
        for(i=0; i < detail_item.length;i++)
        {
            console.log("i="+i+", detail_item[i].innerText="+detail_item[i].innerText);
            if(vin_re.test(detail_item[i].innerText))
            {
                vin_match=detail_item[i].innerText.match(vin_re)[1];
                if(result.vin_str.length>0) result.vin_str=result.vin_str+",";
                result.vin_str=result.vin_str+vin_match;
            }
        }
        GM_setValue("VIN_result",result);
    }
    function is_waynereaves()
    {
        var powered=document.getElementsByClassName("powered-by");
        if(powered.length>0 && powered[0].getElementsByTagName("a").length>0 && powered[0].getElementsByTagName("a")[0].href.indexOf("waynereaves.com")!==-1) return true;
        return false;
    }

    function do_autocorner()
    {
        var result={vin_str:""};
        console.log("Doing autocorner");
        var i,j;
        var thumb=document.getElementsByClassName("thumb_desc");
        var inps;
        if(window.location.href.indexOf("cat_pages/inventory_1.shtml")===-1)
        {
            console.log("Thumb missed="+window.location.href.replace(/\/?$/,"/cat_pages/inventory_1.shtml"));
            GM_setValue("curr_site",window.location.href.replace(/(https?:\/\/[^\/]+)\/?.*$/,"$1/cat_pages/inventory_1.shtml"));
            return;
        }
        var url_prefix=window.location.href.match(/https?:\/\/[^\/]+/)[0];
        var vin_count=0;

        for(i=0; i<thumb.length;i++)
        {
            inps=thumb[i].getElementsByTagName("input")[1];
            var url_str=inps.getAttribute("onclick").replace(/javascript:window\.location\=\'([^\']*)\'/,"$1");
            var full_url=url_prefix+url_str;
            GM_xmlhttpRequest({
                method: 'GET',
                url:    full_url,

                onload: function(response) {
                    //   console.log("On load in crunch_response");
                    //    crunch_response(response, resolve, reject);
                    var doc = new DOMParser()
                    .parseFromString(response.responseText, "text/html");
                    var veh_table=doc.getElementsByClassName("veh_overview")[0];
                    var new_vin_str=veh_table.rows[1].cells[1].innerText;
                    if(vin_count>0) new_vin_str=","+new_vin_str;
                    result.vin_str=result.vin_str+new_vin_str;
                    vin_count++;
                    if(vin_count>=thumb.length)
                    {
                        GM_setValue("VIN_result",result);
                        return;
                    }
                },
                onerror: function(response) { },
                ontimeout: function(response) { }


            });

            console.log("url_str="+url_str);

        }

    }
    function is_autocorner()
    {
        var copy=document.getElementsByClassName("copy");
        if(copy.length>0)
        {

            console.log("copy="+copy[0].innerText);
        }
        if(copy.length>0 && copy[0].innerText.indexOf("AutoCorner")!==-1) return true;
        return false;
    }

    function do_hasyourcar()
    {
        console.log("doing has your car");
        var i,j;
        var inv=document.getElementsByClassName("inv-item-content");
        var result={vin_str:""};

        for(i=0; i < inv.length; i++)
        {
            var vin_span=inv[i].getElementsByTagName("span");
            for(j=0; j < vin_span.length; j++)
            {
                if(vin_span[j].innerText.indexOf("VIN")!==-1)
                {
                    var the_str=vin_span[j].nextElementSibling.innerText;
                    console.log("vin="+the_str);

                    if(the_str.length===17)
                    {
                        if(result.vin_str!=="") result.vin_str=result.vin_str+",";
                        result.vin_str=result.vin_str+the_str;
                    }
                }
            }
        }
        console.log("Setting value");
        GM_setValue("VIN_result",result);

    }

    function do_carsforsale2()
    {
        console.log("Cars for sale 2");
    }
    function is_carsforsale2()
    {
        var lbl=document.getElementById("ctl00_lblFooterText");
        if(lbl!==null && lbl.innerText.indexOf("Carsforsale.com")!==-1) return true;
        return false;
    }
    function do_carsforsale()
    {
        console.log("Cars for sale href="+window.location.href);
        if(window.location.href.indexOf("/inventory")===-1)
        {
            GM_setValue("curr_site",window.location.href.replace(/\/?$/,"/inventory"));
        }
    }
    function is_carsforsale()
    {
        var copy=document.getElementsByClassName("copyright-section");
        if(copy.length>0 && copy[0].innerText.indexOf("Powered by Carsforsale.com")!==-1) return true;
        return false;
    }

    function do_automanager()
    {
        var result={vin_str:""};
        var i;

        var vin=document.getElementsByClassName("vin");
        for(i=0; i < vin.length; i++)
        {
            console.log("vin[i]="+vin[i].innerText);
            if(vin[i].innerText.length===17)
            {
                if(result.vin_str!=="") result.vin_str=result.vin_str+",";
                result.vin_str=result.vin_str+vin[i].innerText;
            }
        }
        console.log("Setting value");
        GM_setValue("VIN_result",result);
    }

    function is_automanager()
    {
        var corp=document.getElementsByClassName("corp");
        if(corp.length>0 && corp[0].href.indexOf("automanager.com")!==-1) return true;
        return false;

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

    else if(window.location.href.indexOf("mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
                var btn_span2=document.createElement("span");
        var btn_automate=document.createElement("button");
        var btn_reset=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_reset.className="btn btn-secondary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_reset.innerHTML="Reset";
        btn_span.appendChild(btn_automate);
        btn_span2.appendChild(btn_reset);

        pipeline.insertBefore(btn_span, my_secondary_parent);
        pipeline.insertBefore(btn_span2,btn_span);
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
        btn_reset.addEventListener("click",function(e) { console.log("Resetting curr_site"); GM_setValue("curr_site","https://www.yahoo.com"); });
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
    else //(window.location.href.indexOf(GM_getValue("curr_site","https://www.yahoo.com"))!==-1)
    {
        var curr_site=GM_getValue("curr_site","https://www.yahoo.com");


        GM_addValueChangeListener("curr_site",function() {
            GM_setValue("old_site",curr_site);

            window.location.href=GM_getValue("curr_site");
        });
        console.log("On site, setting timeout");
        setTimeout(do_autos, 2000);
    }


})();