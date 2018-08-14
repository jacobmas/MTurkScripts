// ==UserScript==
// @name         SteveWeb
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

    var automate=false;
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;
    var limited_re=/\s*((Limited)|(Ltd))[\.]?/i;

    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["companieshouse.gov.uk","companieslist.co.uk","linkedin.com","facebook.com",
                  "twitter.com","crunchbase.com","bizdb.co.uk","companycheck.co.uk","bloomberg.com","companiesdb.org",
                 "companiesintheuk.co.uk","192.com","bizstats.co.uk","tripadvisor.co.uk","opendi.co.uk","cylex-uk.co.uk",".edu","site2corp.co.uk",
                 "thesun.co.uk","companydirectorcheck.com","foodhygieneratings.org.uk","store-opening-times.co.uk/","ebay.co.uk",
                 "azure-book.com","britaine.co.uk","indeed.co.uk","company-director-search.co.uk","themeaningofthename.com","dictionary.com",
                 "ordertakeaways.co.uk","near.co.uk","careerdirectedsolutions.co.uk","10times.com","tripadvisor.co.uk","instagram.com","issuu.com",
                 "b4r-uk.com","business.site","companydossier.co.uk","infinitespider.com","job-reviews.co.uk","soundcloud.com","wemod.com",
                 "freeindex.co.uk","github.com","urlm.co.uk/","streetmapof.co.uk/","plus.google.com","howstuffworks.com",
                 "abbreviations.com","ebaymotorspro.co.uk","acronymfinder.com",".tumblr.com","behance.net","vimeo.com",
                 "gamepedia.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

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
    String.prototype.count_char = function(to_count)
    {
        var ret=0;
        for(var i=0; i < this.length; i++)
        {
            if(this[i]===to_count) ret++;
        }
        return ret;
    }
    function log_index(index, message)
    {
        console.log("("+index+"), "+message);
    }
    function is_bad_home(index, the_url)
    {
        var i;
        the_url=the_url.replace(/https?:\/\//,"").replace(/[\-\+_]/g," ").replace(/\+/g," ");
        var split_url=the_url.split("/");
        for(i=1; i < split_url.length; i++)
        {
            //console.log("("+index+"), split_url[i]="+split_url[i]+", count spaces="+split_url[i].count_char(' '));
            if(split_url[i].count_char(' ')>=2) return true;
        }
        return false;


    }
    function is_good_url(index, i_pos, the_url)
    {
        var short_name=my_query.queries[index].name.replace(limited_re,"").replace(/[\-\s]/g,"").toLowerCase();
        var short_url=the_url.replace(/[\-\+\.]+/g,"").toLowerCase();
        log_index(index, "short_url="+short_url+", short_name="+short_name);
        if(short_url.indexOf(short_name)!==-1)
            return true;
        return false;
    }
    function is_bad_url2(index, i_pos, the_url, the_title, bad_urls)
    {
        var i;
        if(is_bad_home(index, the_url))
        {
            return true;
        }
        if(the_url.indexOf("?")!==-1) return true;
        for(i=0; i < bad_urls.length; i++)
        {
            if(the_url.indexOf(bad_urls[i])!==-1) return true;
        }
        var bad_url_re=/https?:\/\/[^\/]*\/[^\/]*\/[^\/]+/;
        console.log("("+index+"), the_title="+the_title.toLowerCase()+", first="+my_query.queries[index].first.toLowerCase());
        if(bad_url_re.test(the_url) || (((i_pos>0 && i_pos < 3)
                                         || (my_query.queries[index].query_count>0))
                                          && the_title.toLowerCase().indexOf(my_query.queries[index].first.toLowerCase()+" ")===-1
                                       && !is_good_url(index, i_pos, the_url)))
        {
            console.log("("+index+"), Found bad url too many, the_url="+the_url+", badtitle="+(the_title.toLowerCase().indexOf(my_query.queries[index].first.toLowerCase())==-1));
            return true;
        }
        else if((my_query.queries[index].first.length<= 2 || i_pos >= 3) && !my_query.queries[index].name_regexp.test(the_title))
        {
            return true;
        }


        //console.log("the_url.split(\"/\").length="+the_url.split("/").length);
        //if(the_url.split("/").length>=5) return true;
        return false;
    }

    function query_response(index, response,resolve,reject) {
        var doc = new DOMParser()

        .parseFromString(response.responseText, "text/html");
        var temp_str;
        console.log("("+index+"), in query_response try number "+my_query.queries[index].query_count+"\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            log_index(index, "b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                log_index(index, "b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }
           
            for(i=0; i < b_algo.length && i < 6; i++)
            {

                temp_str="";
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                if(b_algo[i].getElementsByTagName("p").length>0)
                {
                    temp_str=b_algo[i].getElementsByTagName("p")[0].innerText;
                }
                log_index(index, "i="+i+", b_url="+b_url);

                if(!is_bad_url2(index, i,b_url, b_name+"\n"+temp_str, bad_urls))
                {

                    b1_success=true;
                    my_query.results[index][" confidence"]=get_confidence(i,b_url);
                    break;

                }
                
            }
            if(b1_success)
            {
                my_query.results[index].web_url=b_url;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url:    b_url,
                    timeout: 3500,

                    onload: function(response) {
                        //   console.log("On load in crunch_response");
                        //    crunch_response(response, resolve, reject);
                        my_query.results[index].web_valid="Yes";
                        resolve("Finished");
                    },
                    onerror: function(response) {
                        my_query.results[index].web_valid="No";
                        resolve("Finished");

                    },
                    ontimeout: function(response) { my_query.results[index].web_valid="No";
                                                   resolve("Finished"); }


                });
                return;
            }
            else if(my_query.queries[index].query_count===0)
            {
                log_index(index, "**** Failed try 0");
                my_query.queries[index].query_count=my_query.queries[index].query_count+1;
                my_query.queries[index].query_name=my_query.queries[index].query_name.replace(" site:.uk","");
                query_search(index,resolve,reject)
                return;
            }
            else if(my_query.queries[index].query_count===1)
            {
                log_index(index, "**** Failed Try 1");
                my_query.queries[index].query_count=my_query.queries[index].query_count+1;
                my_query.queries[index].query_name=my_query.queries[index].query_name.replace(limited_re,"");
                query_search(index,resolve,reject)
                return;
            }
            else if(my_query.queries[index].query_count===2)
            {
                console.log("("+index+"), last try");
                my_query.queries[index].query_count=my_query.queries[index].query_count+1;
                my_query.queries[index].query_name=my_query.queries[index].query_name.replace(/\"/g,"");
                my_query.queries[index].query_name="\""+my_query.queries[index].query_name+"\"";
                query_search(index,resolve,reject)
                return;
            }
            else
            {
                console.log("LIMITED TEST="+limited_re.test(my_query.queries[index].query_name));
                my_query.results[index].web_url="not found";
                my_query.results[index][" confidence"]="5";
                resolve("Finished");
                return;
            }
           /* if(!found_url)
            {
                document.getElementById("UrlBad").checked=true;
                check_and_submit();
                b1_success=true;
                return;
            }*/

          //GM_setValue("returnHit",true);
            //return;

        }
        catch(error)
        {
            console.log("Error "+error);
            GM_setValue("returnHit",true);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }
        GM_setValue("returnHit",true);
        return;

    }
    /* Edit to lower confidence in some instances */
    function get_confidence(index, b_url)
    {
        var bad_url_re=/https?:\/\/[^\/]*\/[^\/]+/;
        if(bad_url_re.test(b_url))
        {
            console.log("No confidence");
            return 1;
        }
        return 5;
    }
    function query_search(i,resolve,reject) {
        var search_str=my_query.queries[i].query_name+" ";

        log_index(i, "Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             query_response(i, response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(to_parse) {
        my_query.queriesDone=my_query.queriesDone+1;
        console.log("**** my_query.queriesDone="+my_query.queriesDone);
        if(my_query.queriesDone>=my_query.numQueries && !my_query.submitted)
        {
            /* Done with everything */
            my_query.submitted=true;
            add_to_sheet();
            check_and_submit(check_function,automate);
            return;
        }
       

    }

    function add_to_sheet()
    {
        var i;
        for(i=0; i < my_query.numQueries; i++)
        {
            document.getElementsByName("web_url")[i].value=my_query.results[i].web_url;
            document.getElementsByName("web_valid")[i].value=my_query.results[i].web_valid;
            document.getElementsByName("web_valid")[i].required=false;
            document.getElementsByName(" confidence")[i].value=my_query.results[i][" confidence"];
        }

    }


    function parse_company_name(name)
    {
        name=name.replace(/^([^\s]+)/i,"\"$1\"").replace(" (UK) ","").replace(/\([^\)]*\)/,"");
        return name;//.replace(/\s*Limited/i,"");
    }

    function regexp_name(to_shorten)
    {
        to_shorten=to_shorten.replace(limited_re,"");
        to_shorten=to_shorten+"(\\s+|$)";
        return new RegExp(to_shorten,'i');
    }
    function init_Query()
    {
        var i, j;
        var curr_query;
        var queryPromises=[];
        var currPromise;
        var curr_name;
        my_query={queries:[], queriesDone: 0,results:[], submitted: false};
        /* Multiple tables */
       var wT=document.getElementById("workContent").getElementsByTagName("table");
        /* Parse tables */
        my_query.numQueries=wT.length;
        var temp_first;
        console.log("Total queries: "+my_query.numQueries);
        for(i=0; i < wT.length; i++)
        {
            curr_name=wT[i].rows[1].cells[1].innerText;
            curr_query={number: wT[i].rows[0].cells[1].innerText, name:curr_name, name_regexp: regexp_name(curr_name),
                        query_name: parse_company_name(wT[i].rows[1].cells[1].innerText+" site:.uk"),
                        industry: wT[i].rows[2].cells[1].innerText, description: wT[i].rows[3].cells[1].innerText,
                        address:  wT[i].rows[4].cells[1].innerText, query_count: 0};
            curr_query.first=curr_query.name.split(" ")[0].trim();
            my_query.queries.push(curr_query);
            my_query.results.push({web_url: "", web_valid: "", " confidence":""});
            currPromise = new Promise((resolve, reject) => {
                console.log("Beginning URL search");
                query_search(i, resolve, reject);
            });
            currPromise.then(query_promise_then
                                 )
                    .catch(function(val) {
                    console.log("Failed at  queryPromise "+i+", message=" + val); GM_setValue("returnHit",true); });
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

            init_Query();
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