// ==UserScript==
// @name         MarketingRedTripAdvisor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://*.tripadvisor.com/*
// @include file://*
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


// VCF Do something with?
(function() {
    'use strict';

    var automate=true;
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
    var key_words=["State Park","Refuge"];
    var replace_words={"SF":"State Forest","SRA":"State Recreation Area","NF":"National Forest"};

    var div_text='<div id="TA_selfserveprop000" class="TA_selfserveprop">\n'+
'<ul id="0000000" class="TA_links 1111111">\n'+
'<li id="2222222" class="3333333">\n'+
'<a target="_blank" href="https://www.tripadvisor.com/"><img src="https://www.tripadvisor.com/img/cdsi/img2/branding/150_logo-11900-2.png" alt="TripAdvisor"/></a>\n'+
'</li>\n'+
'</ul>\n'+
'</div>\n'+
'<script async src="https://www.jscache.com/wejs?wtype=selfserveprop&amp;uniq=000&amp;locationId=0&amp;lang=en_US&amp;rating=true&amp;nreviews=5&amp;writereviewlink=true&amp;popIdx=true&amp;iswide=false&amp;border=false&amp;display_version=2"></script>';

    function getRndAlphaNum()
    {
        var the_rnd=Math.floor(Math.random() * 62);
        if(the_rnd<10) return String.fromCharCode(48+the_rnd)
        else if(the_rnd < 36) return String.fromCharCode(65+(the_rnd-10));
        else return String.fromCharCode(97+(the_rnd-36));
    }
    function rand_3digit()
    {
        var x = " "+Math.floor(Math.random()*1000);
        while(x.length<3) x="0"+x;
        return x;
    }

    function rand_str(len)
    {
        var ret="";
        var i;
        for(i=0; i < len; i++) ret=ret+getRndAlphaNum();
        return ret;
    }

    function check_function()
    {
        return true;
    }
    function check_and_submit(check_function, automate)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");


        if(automate)
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    String.prototype.str_in_array=function(the_array)
    {
        var i;
        for(i=0; i < the_array.length; i++)
        {
            if(the_array[i].toLowerCase().indexOf(this.toLowerCase())!==-1) return true;
        }
        return false;
    }
    String.prototype.array_elem_in_str=function(the_array)
    {
        var i;
        for(i=0; i < the_array.length; i++)
        {
            if(this.toLowerCase().indexOf(the_array[i].toLowerCase())!==-1) return true;
        }
        return false;
    }
    function is_bad_url2(b_url, bad_urls)
    {
        var url=b_url.replace(/https?:\/\/[^\/]*\//,"");
        url=url.replace("_s_","s_");
        var split_url=url.split("-");
        console.log("split_url="+JSON.stringify(split_url));
        if(split_url.length<6 || split_url[0].indexOf("Review")===-1)
        {
            console.log("_Review not found");
            return true;
        }
        var the_name=split_url[4].replace("_"," ");
        var query_first=my_query.name.split(" ")[0];
        if(the_name.toLowerCase().indexOf(query_first.toLowerCase())===-1)
        {
            console.log(query_first+" not found in "+the_name);
            return true;
        }
        var split_placepart=split_url[5].replace(/_/g," ");
        if(split_placepart.toLowerCase().indexOf(my_query.state.toLowerCase())===-1)
        {
            console.log("bad state, "+my_query.state+" not in "+split_placepart);
            return true;
        }
        return false;
    }

    function query_response(response,resolve,reject) {
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
                document.getElementById("tripadvisor_code").value="Not Listed";
                check_and_submit(check_function, automate);
                return;
            }
           
            for(i=0; i < b_algo.length && i < 10; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                console.log("i="+i+", b_url="+b_url);

                if(!is_bad_url2(b_url, bad_urls))
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
        document.getElementById("tripadvisor_code").value="Not Listed";
        check_and_submit(check_function, automate);
//        reject("Nothing found");
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
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        url=url.replace(/https?:\/\/[^\/]*\//,"");
        var split_url=url.split("-");
        var locId=split_url[2].substr(1);
        console.log("locId="+locId);
        var my3=rand_3digit();
        var id1=rand_str(7);
        var id2=rand_str(7);
        var class1=rand_str(7), class2=rand_str(7);
        var my_div_text=div_text.replace("id=\"TA_selfserveprop000\"","id=\"TA_selfserveprop"+my3+"\"")
        .replace("uniq=000&amp;locationId=0","uniq="+my3+"&amp;locationId="+locId)
        .replace("class=\"TA_links 1111111\"", "class=\"TA_links "+class1+"\"")
        .replace("id=\"0000000\"","id=\""+id1+"\"")
        .replace("id=\"2222222\"","id=\""+id2+"\"")
        .replace("class=\"3333333\"","id=\""+class2+"\"");
        GM_setValue("result","");
        GM_addValueChangeListener("result", function() {
            console.log("Found stuff");
            var result=GM_getValue("result");
            if(result.length===1) result=result+".0";
            if(result!=="-1")
            {
                console.log("Setting rating");
                document.getElementsByName("tripadvisorrating")[0].value=result;
            }
            document.getElementById("tripadvisor_code").value=my_div_text;
            check_and_submit(check_function,automate);

        });
        GM_setValue("url",url);

    }

    function do_tripadvisor()
    {
        var result="-1";
        console.log("Doing trip advisor");
        var ui_bubble=document.getElementsByClassName("ui_bubble_rating");
        if(ui_bubble.length>0)
        {
            console.log("bubbles found");
            var rating=ui_bubble[0].getAttribute("alt").replace(" of 5 bubbles","");
            result=rating;
        }
        console.log("result="+result);
        GM_setValue("result",result);
    }



    function init_Query()
    {
        var i;
        var inst_body=document.getElementById("instructionBody");
       //inst_body.style.display="block";
       var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:wT.rows[0].cells[1].innerText, city:wT.rows[1].cells[1].innerText, state: wT.rows[3].cells[1].innerText};
        var name_split=my_query.name.split(" ");
        var new_name="";
        for(i=0; i < name_split.length; i++)
        {
            if(name_split[i] in replace_words) new_name=new_name+replace_words[name_split[i]];
            else new_name=new_name+name_split[i];
            if(i < name_split.length-1) new_name=new_name+" ";
        }
        my_query.name=new_name;
        if(my_query.name.indexOf("-")!==-1)
        {
            var new_str="";
            var split_query=my_query.name.split(" - ");
            for(i=0; i < split_query.length; i++)
            {
                if(split_query[i].length>new_str.length || split_query[i].array_elem_in_str(key_words)) new_str=split_query[i];
                if(new_str.array_elem_in_str(key_words))
                {
                    break;
                }
            }
            my_query.name=new_str;

        }
        console.log("New my_query="+my_query.name);
        var search_str=my_query.name+" "+my_query.city+" "+my_query.state+" site:tripadvisor.com";
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
    else if(window.location.href.indexOf("tripadvisor.com")!==-1)
    {
        GM_setValue("url","");
        GM_addValueChangeListener("url", function() { window.location.href=GM_getValue("url"); });
        do_tripadvisor();
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