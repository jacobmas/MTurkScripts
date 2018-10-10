// ==UserScript==
// @name         TridentYelp
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Stuff about JJNissen
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
    var bad_urls=["www.mapquest.com","local.yahoo.com","yelp.com","birdeye.com","findglocal.com",
                 "facebook.com","menupix.com","www.tripadvisor.com","www.zomato.com","foursquare.com","manta.com",
                 "yellowpages.com","whitepages.com","moviefone.com","s3.amazonaws.com","walkscore.com","superpages.com",
                     "bizapedia.com","restaurants.com","city-data.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function bad_email_url(to_check)
    {
        let i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(to_check.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }

    function check_and_submit()
    {

        console.log("Checking and submitting");


        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
        }
    }
    function is_bad_url(the_url)
    {
        var i;
        for(i=0; i < bad_urls.length; i++)
        {
            if(the_url.indexOf(bad_urls[i])!==-1) return true;
        }
        return false;
    }
    function add_to_sheet(yelpid, rating)
    {
        document.getElementById("yelpid").value=yelpid;
        document.getElementsByName("yelprating")[0].value=rating;

    }
    function my_parse_address(to_parse)
    {
        var ret_add={};
        var state_re=/([A-Za-z]+) ([\d\-]+)$/;
        var canada_zip=/ ([A-Z]{2}) ([A-Z][\d][A-Z] [\d][A-Z][\d])$/;
        to_parse=to_parse.replace(canada_zip,", $&");

        console.log("to_parse="+to_parse);
        var my_match;
        var splits=to_parse.split(",");
        if(splits.length===3)
        {
            if(canada_zip.test(splits[2]))
            {
                my_match=splits[2].match(canada_zip);
                ret_add.state=my_match[1];
                ret_add.zip=my_match[2];
            }
            else
            {
                my_match=splits[2].match(state_re);
                if(my_match!==null && my_match!==undefined)
                {
                    ret_add.state=my_match[1];
                    ret_add.zip=my_match[2];
                }
            }
            ret_add.street=splits[0].trim();
            ret_add.city=splits[1].trim();
        }
        else if(splits.length==2)
        {

            if(canada_zip.test(splits[1]))
            {
                my_match=splits[1].match(canada_zip);
                ret_add.state=my_match[1];
                ret_add.zip=my_match[2];
            }
            else
            {
                my_match=splits[1].match(state_re);
                if(my_match!==null && my_match!==undefined)
                {
                    ret_add.state=my_match[1];
                    ret_add.zip=my_match[2];
                }
            }
            ret_add.street="";
            ret_add.city=splits[0].trim();
        }
        if(ret_add.city===undefined || ret_add.state===undefined || ret_add.zip===undefined)
        {
            to_parse=to_parse.replace(/\, ([\d]{5})\,? ([A-Z]{2})/, ", $2 $1");
            console.log("to_parse="+to_parse);
            var new_add=parseAddress.parseLocation(to_parse);
            ret_add.street="";
            if(new_add.number!==undefined)
            {
                ret_add.street=ret_add.street+new_add.number+" ";
            }
            ret_add.street=ret_add.street+new_add.street+" ";
            if(new_add.type!==undefined)
            {
                ret_add.street=ret_add.street+new_add.type;
            }
            ret_add.street=ret_add.street.trim();
            ret_add.city=new_add.city;
            ret_add.state=new_add.state;
            if(new_add.zip!==undefined) { ret_add.zip=new_add.zip; }
            else { ret_add.zip=""; }
            console.log("new_add="+JSON.stringify(new_add));
        }
        return ret_add;
    }
    function camp_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in camp_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
        console.log(response.finalUrl);
        var search, b_algo, i, j, b_url="crunchbase.com", b_name, b_top;
        var good_url, lgb_info, b_context, b_factrow, b_caption;
        var b1_success=false, b_header_search, b_srtxt;
        var inner_a, name_split, the_address="", the_phone="";
        var b_vList, b_entityTP, cbl, add_success=false, phone_success=false;
        try
        {
            search=doc.getElementById("b_content");
            console.log("search="+search);
         //   b_top=search.getElementById("lgb_info");
            
           

            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
               
                //return;
            }

            i=0;
            var yelpid_re=/https?:\/\/www\.yelp\.com\/biz\/([^\?]*)?/;
            var yelpid="", yelpid_match,rating_match;
            var loc_re=/Location: (.*)\s*((Phone:)|($))/, loc_phone_re=/Phone: (.*)\s*Location: (.*)$/;
            var rating_re=/([\d](\.[\d])?)\/[\d](\.[\d])?/;
            var add_re=/Address: (.*)\s*Phone: ([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/;
            var loc_match, rating="0.0", h2_title, first_word;

            for(i=0; i < b_algo.length; i++)
            {
                rating="3.0";
                yelpid="";

                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                h2_title=b_algo[i].getElementsByTagName("h2")[0].innerText;
                if(b_url.indexOf("/map/")!==-1)
                {
                    console.log("url is map");
                    b_url=b_url.replace(/\/map\//,"/biz/");
                    h2_title=h2_title.replace(/^Directions - /,"").replace(/\s*...$/,"");
                }
                first_word=h2_title.split(" ")[0];
                console.log("h2: "+h2_title);
                yelpid_match=b_url.match(yelpid_re);
                if(yelpid_match!==null && yelpid_match.length>1)
                {
                    yelpid=yelpid_match[1];
                }
                b_factrow=b_algo[i].getElementsByClassName("b_factrow");
                if(b_factrow!==null && b_factrow!==undefined && b_factrow.length>0)
                {
                    b_srtxt=b_factrow[0].getElementsByClassName("b_srtxtstarcolor");
                    if(b_srtxt!==null && b_srtxt!==undefined && b_srtxt.length>0)
                    {
                        rating_match=b_srtxt[0].innerText.match(rating_re);
                        if(rating_match!==null && rating_match.length>1)
                        {
                            rating=rating_match[1];
                            if(rating_match[1].length===1) rating=rating+".0";
                        }
                    }
                    loc_match=b_factrow[0].innerText.match(loc_re);
                if(loc_match!==null)
                {
                    console.log(JSON.stringify(loc_match));
                }

                }

                console.log("yelpid="+yelpid+", rating="+rating);
                if(!is_good_yelp_entry(b_algo, h2_title, first_word, b_factrow))
                {
                    console.log("Bad entry, continuing");
                    continue;
                }
                if(yelpid.length>0 && rating!=="0.0")
                {
                    add_to_sheet(yelpid, rating);
                    check_and_submit();
                    return;
                }


            }
            if(b1_success)
            {
                resolve(JSON.stringify({url: b_url, error:false}));
            }
            else if(my_query.try_count===0)
            {
                my_query.try_count++;
                camp_search(resolve,reject);
                return;
            }
            else if(my_query.try_count>0)
            {
             var yelp_url="https://www.yelp.com/search?find_desc="+my_query.name.replace(/\s/g,"+")+
                 "&find_loc="+my_query.city.replace(/\s/g,"+")+",+"+my_query.state.replace(/\s/g,"+");

                console.log("No urls found, trying yelp directly");
                       GM_xmlhttpRequest({ method: 'GET', url:    yelp_url,

            onload: function(response) {

             yelp_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
                //reject(b_algo.length);
            }
        }
        catch(error)
        {

            console.log("Error "+error);
            reject(JSON.stringify({error: true, errorText: error}));
        }
    }

    function yelp_response(response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in yelp_response "+response.finalUrl);
        var i,j;
         var yelpid_re=/https?:\/\/www\.yelp\.com\/biz\/([^\?]*)?/, yelpid, yelpid_match;

        var search=doc.getElementsByClassName("search-result"), biz_name, b_url,b_name,rating,stars;
        for(i=0; i < search.length; i++)
        {
            rating="0.0";
            biz_name=search[i].getElementsByClassName("biz-name");
            stars=search[i].getElementsByClassName("i-stars");
            if(stars.length>0 && biz_name.length>0)
            {
                rating=stars[0].title.replace(/\s.*$/,"");
                b_url=biz_name[0].href.replace(/https?:\/\/[^\/]+\//,"https://www.yelp.com/");
                b_name=biz_name[0].innerText;
                console.log("("+i+"), b_url="+b_url+", b_name="+b_name);
                yelpid_match=b_url.match(yelpid_re);
                yelpid=null;
                if(yelpid_match!==null && yelpid_match.length>1)
                {
                    yelpid=yelpid_match[1];
                }
                if(is_good_yelp_entry(null,b_name.toLowerCase(),b_name.toLowerCase().split(" ")[0]) && rating!=="0.0" && yelpid!==null)
                {
                    add_to_sheet(yelpid, rating);
                    check_and_submit();
                    return;
                }

            }

        }
        console.log("Nothing found in "+i+" entries on yelp");
        reject("");
       // console.log(doc.getElementsByClassName("search-result")[0].innerHTML);
    }

    function parse_factrow_Location(to_parse)
    {
        var i;
        var result={state:""};
        var comma_split;
        if(/\s*[A-Z]{2}$/.test(to_parse))
        {
            result.state=to_parse.match(/\s([A-Z]+)$/)[1];
        }
        else if(/s*([\d\-]{5,})$/.test(to_parse))
        {
            result.zip=to_parse.match(/s*([\d\-]{5,})$/)[1];
            to_parse=to_parse.replace(/s*([\d\-]{5,})$/,"").trim();
            if(/\s*[A-Z]{2}$/.test(to_parse))
            {
                result.state=to_parse.match(/\s([A-Z]+)$/)[1];
            }
        }

        to_parse=to_parse.replace(/\s*[A-Z]{2}$/,"").replace(/\s*,\s*$/,"").trim();
       // console.log("to_parse="+to_parse);
        comma_split=to_parse.split(", ");
        if(comma_split.length>=2)
        {
            result.city=comma_split[comma_split.length-2].trim();
        }
        else
        {
            result.city=to_parse.match(/([^\d]+)$/)[1].trim();
        }

        return result;
    }

    function is_good_yelp_entry(b_algo, place_name, first_word, b_factrow)
    {
        var i,inner_li;
        var loc_re=/Location: (.*)$/,loc_match,loc_result;
        first_word=first_word.replace(/[’'\.,]+/g,"");
        console.log("place_name="+place_name);
        place_name=place_name.replace(/-.*$/,"").replace(/[’'\.,]+/g,"").trim().toLowerCase();
        var name_lower=my_query.name.toLowerCase().replace(/[’'\.,]+/g,"");
        var matches_all_words=true;
        if(b_factrow!==undefined && b_factrow.length>0)
        {
            inner_li=b_factrow[0].getElementsByTagName("li");
            for(i=0; i < inner_li.length; i++)
            {
               // console.log("inner_li["+i+"]="+inner_li[i].innerText);
                loc_match=inner_li[i].innerText.match(loc_re);
                if(loc_match!==null)
                {
                    loc_result=parse_factrow_Location(loc_match[1]);
                    console.log("loc_result="+JSON.stringify(loc_result)+", state_map[my_query.state]="+state_map[my_query.state]+
                               "\tmy_query.city="+my_query.city);
                    if(loc_result.state!==undefined && loc_result.state.length>0 && state_map[my_query.state]!==loc_result.state
                      ||( loc_result.city!==undefined && my_query.city.indexOf(loc_result.city)===-1 && loc_result.city.indexOf(my_query.city)===-1
                        && my_query.city.length>0)
                      )
                    {
                        return false; }
                }
            }
        }
        console.log("my_query.name.toLowerCase()="+my_query.name.toLowerCase()+"\tfirst_word.toLowerCase()="+first_word.toLowerCase());
        if(my_query.name.toLowerCase().indexOf(first_word.toLowerCase())!==-1)
        {
            return true;
        }
        else {
            var place_split=place_name.split(" ");
            for(i=0; i < place_split.length; i++)
            {
                console.log("name_lower="+name_lower+"\tplace_split["+i+"]="+place_split[i]);
                if(name_lower.indexOf(place_split[i])===-1)
                {
                    matches_all_words=false;
                    break;
                }
            }
            if(matches_all_words) return true;
        }
        if(my_query.name.indexOf("KOA")!==-1 && place_name.indexOf("koa")!==-1) return true;
        return false;
    }

    function camp_search(resolve,reject) {
        var search_str;
        if(my_query.try_count===0) search_str=my_query.name+" "+ my_query.city+" "+my_query.state+" site:yelp.com";
       else if(my_query.try_count>0) search_str=my_query.name+" "+my_query.state+" site:yelp.com";
//        if(!first_try) google_search_str=google_search_str+" "+my_query.country;
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             camp_response(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }
    function get_domain_only(the_url)
    {
        var httpwww_re=/https?:\/\/www\./;
        var http_re=/https?:\/\//;
        var slash_re=/\/.*$/;
        var ret=the_url.replace(httpwww_re,"").replace(http_re,"").replace(slash_re,"");
        return ret;
    }
    /* Following the finding the district stuff */
    function camp_promise_then(to_parse) {

        var search_str, search_URI, search_URIBing;
        console.log("to_parse="+to_parse);

    }



    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++) {
            if(to_check.indexOf(prefixes[j])===0) return true;
        }
        return false;
    }
    function parse_name(to_parse)
    {
        var suffixes=["Jr","II","III","IV","CPA","CGM"];
        var split_parse=to_parse.split(" ");
        var last_pos=split_parse.length-1;
        var j;
        var caps_regex=/^[A-Z]+$/;
        var ret={};
        for(last_pos=split_parse.length-1; last_pos>=1; last_pos--)
        {
            if(!prefix_in_string(suffixes,split_parse[last_pos]) && !caps_regex.test(split_parse[last_pos])) break;

        }
        ret.lname=split_parse[last_pos];
        ret.fname=split_parse[0];
        if(last_pos>=2 && split_parse[1].length>=1) {
            ret.mname=split_parse[1].substring(0,1); }
        else {
            ret.mname=""; }
        return ret;

    }

    function init_Camp()
    {
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];

        var orig_name=wT.rows[0].cells[1].innerText.replace(/^BLM/,"");
        orig_name=orig_name.replace(/(RV Park)(.*)$/,"$1").replace(/,.*$/,"");
        var name_split=orig_name.split(" - ");
        var name;
        if(name_split.length>=2 && /\sPark/.test(name_split[1])) name=name_split[1];
        else if(name_split.length<2 || !/^Mile/.test(name_split[0])) name=name_split[0];
        else name=orig_name.replace(/^Mile[^\-]+\-\s*/,"").trim();


        name=name.replace(/NF/,"National Forest");
        console.log("name="+name);
       // console.log("table.innerText="+wT.innerText+", "+wT.rows.length);
        my_query={name: name, city: wT.rows[1].cells[1].innerText,
                 state: wT.rows[3].cells[1].innerText, try_count:0};
        if(my_query.state==="Alaska" && state_map[my_query.city]!==undefined) {
            my_query.state=my_query.city;
            my_query.city=""; }
        my_query.tried_once=false;
       /* if(my_query.company.length==0){
            my_query.company=my_query.fname+" "+my_query.lname+" lawyer";
        }*/


       // console.log("my_query="+JSON.stringify(my_query));
        first_try=true;



        var search_str, search_URI, search_URIBing;

        const campPromise = new Promise((resolve, reject) => {
            console.log("Beginning camp search on Yelp");
            camp_search(resolve, reject);
        });
        campPromise.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed to find on yelp " + val);
            document.getElementById("yelpid").value="Not Listed";
            document.getElementsByName("yelprating")[0].value="1.0";

            check_and_submit(); });





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

            init_Camp();
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