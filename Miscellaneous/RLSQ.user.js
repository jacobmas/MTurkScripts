// ==UserScript==
// @name         RLSQ
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js

// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var my_query = {};

    var bad_urls=[".amazon.com",".alibaba.com",".aliexpress.com","www.northdata.de",
                  "https://www.verif.com","https://www.einforma.com","http://www.reportaziende.it","https://www.moneyhouse.ch",
                  "https://portal.kyckr.com","http://ranking-empresas.eleconomista.es","http://www.registroimprese.it",
                  "https://www.tmdn.org/tmview/welcome","http://www.wipo.int/branddb/en/","http://bases-marques.inpi.fr/",
                  "http://www.uibm.gov.it/uibm/dati/Avanzata.aspx","https://www.oepm.es/en/signos_distintivos",
                  "https://trademarks.ipo.gov.uk/ipo-tmtext",".etsy.com",".egtcp.com",".china.cn",".appliances-china.com",
                 "ecplaza.net","/twitter.com",".twitter.com",".facebook.com","scientific.net",".easycounter.com","dictionary.com",
                  "en.made-in-china.com",".b2bage.com",".waimaotong.com",
                 "freepatentsonline.com",".weiku.com",".ecol.xyz",".amazon.co.uk"];


    var MTurk=new MTurkScript(20000,200,[],init_Query,"A3L7W9G0ZR2XOL");

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

    function is_bad_name(b_name,b_url,p_caption)
    {

        var super_short=my_query.name.toLowerCase().replace(/[^A-Za-z0-9_]/g,"");
        console.log("super_short="+super_short);
        var slash_split,dot_split,dash_split,underscore_split;
        var elim_regex=/[\.-\s,\'`&\+_]+/g;
        var temp_b_name=MTurkScript.prototype.removeDiacritics(b_name).toLowerCase().replace(elim_regex,"");
        var temp_name=my_query.name.toLowerCase().replace(elim_regex,"");
        var temp_caption=p_caption.toLowerCase().replace(elim_regex,"");
        slash_split=b_url.split("/");
        if(slash_split.length>=4)
        {
            dash_split=slash_split[3].split("-");
            if(dash_split.length>=3) return true;
            underscore_split=slash_split[3].split("_");
            if(underscore_split.length>=3) return true;
            let temp_url4=slash_split[3].toLowerCase().replace(elim_regex,"").replace(/_/g,"");
            if(temp_url4.indexOf(temp_name)!==-1) return true;

        }
        if(slash_split.length>=3)
        {
            slash_split[2]=slash_split[2].replace(/^www\./,"");
            dot_split=slash_split[2].split(".");

            if((dot_split.length>3 || (dot_split.length>2 && !/co|edu|ac|gov|net/.test(dot_split[dot_split.length-2])))
               && dot_split[0].indexOf(super_short)!==-1) return true;

            console.log("dot_split.length="+dot_split.length+", "+dot_split[0].indexOf(super_short));

        }
        if(/\.gov\.[a-z]{2}(\/|$)/.test(b_url)) return true;

        
        console.log("temp_b_name="+temp_b_name+", temp_name="+temp_name+"\ntemp_caption="+temp_caption);
        if(!(temp_b_name.indexOf(temp_name)===-1 && temp_caption.indexOf(temp_name)!==0)) return false;
        if(my_query.name.split(" ").length>2)
        {
            temp_name=my_query.name.replace(/\s+[^\s]*$/,"").toLowerCase().replace(elim_regex,"");

            console.log("temp_b_name="+temp_b_name+", temp_name="+temp_name);
            if(!(temp_b_name.indexOf(temp_name)===-1 && temp_caption.indexOf(temp_name)!==0)) return false;
        }
        temp_b_name=MTurkScript.prototype.removeDiacritics(b_name).toLowerCase().replace(/(\s[\|\-]+.*$)/,"");
        temp_name=my_query.name.toLowerCase();
        if(temp_name.indexOf(temp_b_name)!==-1 || temp_b_name.indexOf(temp_name)!==-1) return false;
        return true;
    }

    var bloom_map={"JP":".jp","CH":".cn"};

    function get_country_from_url(url)
    {
        //bloomberg\.com\/profiles\/
        var bloom_reg=/companies\/(?:[A-Z0-9a-z]+):([A-Z0-9]+)/;
        var ret="",match1="";
        console.log("url="+url);
        if((match1=url.match(bloom_reg)) && bloom_map[match1[1]]!==undefined)
        {
            console.log("Matched bloom "+JSON.stringify(match1)+", "+bloom_map[match1[1]] );
            ret=bloom_map[match1[1]];
            return ret;
        }
        if(/ecplaza\.net|hktdc\.com|made-in-china\.com|ningoboexport\.com/.test(url)) return ".cn";
        return ret;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,b_context;
        var b1_success=false, b_header_search,country="",parsed_context,b_feedbackComponent;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_feedbackComponent=doc.getElementsByClassName("b_feedbackComponent");
            if(b_feedbackComponent.length>0 &&b_feedbackComponent[0].dataset &&b_feedbackComponent[0].dataset.facts) {
                var parsed_feedback=JSON.parse(b_feedbackComponent[0].dataset.facts);
                console.log("parsed_feedback="+JSON.stringify(parsed_feedback));
                if(parsed_feedback.Country) { my_query.found_country=parsed_feedback.Country; }
            }

            if(b_context && (parsed_context=MTurkScript.prototype.parse_b_context(b_context)) && parsed_context.Website) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
                resolve(parsed_context.Website);
                return;
            }


            if(/gmbh\s*$/i.test(my_query.long_name) && my_query.try_state===0)
            {
                country=".de";

            }



            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(country.length===0) country=get_country_from_url(b_url);
                console.log("country="+country);

                b_url=b_url.replace(/index\/en\.aspx$/,"")
                .replace(/\/(en|english|esp)\//,"/")
                .replace(/\/html\//,"/")
                .replace(/\/index.[^\.]*$/,"");



                if(!(!/Official Site/i.test(b_name) &&

                    MTurkScript.prototype.is_bad_url(b_url, bad_urls)) && !is_bad_name(b_name,b_url,p_caption))
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
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(country.length>0 && my_query.try_state===0)
        {
            my_query.try_state++;
            query_search(my_query.long_name+" site:"+country, resolve, reject, query_response,my_query.country);
            return;
        }
        else if(my_query.try_state===0)
        {
            my_query.try_state+=2;
            query_search("+\""+my_query.name+"\" company", resolve, reject, query_response,my_query.country);
            return;
        }
        else if(my_query.try_state===2)
        {
            my_query.try_state++;
             query_search("+\""+my_query.name+"\" company", resolve, reject, query_response);
            return;
        }
        else if(my_query.try_state===1)
        {
            my_query.try_state+=2;
             query_search("+\""+my_query.name+"\" company", resolve, reject, query_response);
            return;
        }

	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,country) {
        console.log("Searching with bing for "+search_str);

        var search_URIBing='https://www.bing.com/search?q=';

        search_URIBing=search_URIBing+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
        if(country!==undefined)
        {
            if(country.toLowerCase()===".co.uk") search_URIBing=search_URIBing+"&cc=gb";
            if(country.toLowerCase()===".de") search_URIBing=search_URIBing+"&cc=de";
            if(country.toLowerCase()===".fr") search_URIBing=search_URIBing+"&cc=fr";
            if(country.toLowerCase()===".es") search_URIBing=search_URIBing+"&cc=es";
            if(country.toLowerCase()===".it") search_URIBing=search_URIBing+"&cc=it";
        }
        else search_URIBing=search_URIBing+"&cc=us";


	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        var country_map={".de":"Germany",".fr":"France",".uk":"Great Britain",".it":"Italy",".at":"Austria",".ch":"Switzerland",".mt":"Malta",
                        ".es":"Spain",".cz":"Czech Republic"}
        var found_country_map={"IN":"India"};
        var match;
        result=result.replace(/\/$/,"").replace(/(https?:\/\/[^\/]+)\/.*$/,"$1");;
        document.getElementsByName("find?")[0].checked=true;
        document.getElementById("Amazon.esURL").value=result;
        if((match=result.match(/\.[^\.]+$/)) && country_map[match[0]]) {
            document.getElementById("Country").value=country_map[match[0]];
        }
        else if(my_query.found_country && found_country_map[my_query.found_country]) {
            document.getElementById("Country").value=found_country_map[my_query.found_country];
        }
        else if(country_map[my_query.country.toLowerCase()]) document.getElementById("Country").value=country_map[my_query.country.toLowerCase()];
        else { console.log("match="+JSON.stringify(match)); }
        MTurkScript.prototype.check_and_submit();

    }





    function init_Query()
    {
        console.log("in init_query");
        var sec=document.getElementById("WebsiteDataCollection");
        sec=sec.nextElementSibling;
        for(var i=0; i < 28; i++)
        {
            sec.style.display="none";
            sec=sec.nextElementSibling;
        }
       // parentNode.removeChild(sec.nextSibling);
        //parentNode.removeChild(sec.nextSibling);

        var wT=document.getElementsByTagName("table")[1];
//          var wT=document.getElementById("workContent").getElementsByTagName("table")[0];

        var dont=document.getElementsByClassName("dont-break-out")[3].innerText;
        console.log("dont="+dont+", length="+document.getElementsByClassName("dont-break-out").length);
      /*  for(var j=0; j < dont.length; j++)
        {
            console.log("dont["+j+"].innerText="+dont[j].innerText);
        }*/

        var country=dont.match(/https?:\/\/([^\/]+)/)[0].match(/\.[^\.]+\.[^\.]+$/)[0];
        if(country.indexOf(".co")!==0) country=country.replace(/^\.[^\.]+/,"");
        console.log("country="+country);
        my_query={long_name:wT.rows[0].cells[1].innerText, name:MTurkScript.prototype.shorten_company_name(wT.rows[0].cells[1].innerText),
                 try_state:0,country:country};



        // try_state 1 is with country
        my_query.name=my_query.name.replace(/\s*Co\.?$/i,"")
        .replace(/\s*Products$/i,"").replace(/\s*Industry$/i,"").replace(/\s*mfg$/i,"");
        console.log("my_query.country="+JSON.stringify(my_query));
	var search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,country);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val);
            if(val!=="Nothing found") {
                GM_setValue("returnHit",true); }
            else
            {
                document.getElementsByName("find?")[1].checked=true;
       // document.getElementById("Amazon.esURL").value=result;
                MTurkScript.prototype.check_and_submit();
            }
        });





    }

})();
