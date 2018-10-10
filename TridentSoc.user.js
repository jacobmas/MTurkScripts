// ==UserScript==
// @name         TridentSoc
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
    var key_words=["State Park","Refuge","State Recreation Area","National Park"];
    var replace_words={"SF":"State Forest","SRA":"State Recreation Area","NF":"National Forest","Rec Area":"Recreation Area","CG":"Campground",
                      "Rec":"Recreation","Nat":"National","Conserve":"Conservation"};
    var search_replace={"State Park":""};//,"RV Park":""};
    var skip_first={"the": 0};
    var state_map={"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE",
                   "District of Columbia": "DC", "Florida": "FL","Georgia": "GA", "Hawaii": "HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA",
                   "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts":"MA", "Michigan": "MI",
                   "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH",
                   "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
                   "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
                   "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
                   "Wisconsin": "WI", "Wyoming": "WY", "Ontario": "ON", "Quebec": "QC", "New Brunswick": "NB", "Alberta": "AB", "Saskatchewan": "SK",
                   "Manitoba": "MB", "British Columbia": "BC","Nova Scotia": "NS"};

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
    function camp_response(website, response,resolve,reject) {
        // console.log(JSON.stringify(response));
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");

        console.log("in camp_response");
//        for(var i in response) console.log("i="+i+", "+response[i]);
       console.log(response.finalUrl);
        var search, b_algo, i, b_url="crunchbase.com", b_name, b_top, good_url, lgb_info, b_context;
        var b_factrow, b_caption, b1_success=false, b_header_search, b_srtxt, inner_a;
        var name_split, the_address="", the_phone="", b_vList, b_entityTP, cbl, add_success=false, phone_success=false;
       // var loc_regex=/^([^\,\.]+)(,|\s*in\s*)\s*([^\,]+),\s*([^\.])\./;
        var loc_regex=/([^,\.]+)(?:,|\s+in\s+)\s*([^\.,]+),\s+([^\.]+)(?:\.|$)/;
        var loc_match, rating="0.0", h2_title, first_word,j;
        var b_paragraph;
        try
        {
            search=doc.getElementById("b_content");
          //  console.log("search="+search);
         //   b_top=search.getElementById("lgb_info");



            b_algo=search.getElementsByClassName("b_algo");

            console.log(website+": b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log(website+": b_algo length=0");
                reject(JSON.stringify({error: true, errorText: "No URLs"}));
                return;
            }

            i=0;
           
            var loc_re=/Location: (.*)\s*((Phone:)|($))/;
            var loc_phone_re=/Phone: (.*)\s*Location: (.*)$/;
            var rating_re=/([\d](\.[\d])?)\/[\d](\.[\d])?/;
            var rating_match,inner_li,loc_result;
            var add_re=/Address: (.*)\s*Phone: ([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/;
            


            for(i=0; i < b_algo.length && i < 3; i++)
            {
                console.log("loop: i="+i);
                rating="3.0";

                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                h2_title=b_algo[i].getElementsByTagName("h2")[0].innerText.replace("s's","s");
               
                var h2_split=h2_title.split(" ");

                j=0;
                while(h2_split[j].toLowerCase() in skip_first) j++;

                first_word=h2_split[j].replace("'","").replace("\'","");
                console.log(website+" first word="+first_word);
                console.log(website+"-h2: "+b_algo[i].getElementsByTagName("h2")[0].innerText);
                b_paragraph="";
                if(b_algo[i].getElementsByClassName("b_caption").length>0 &&
                   b_algo[i].getElementsByClassName("b_caption")[0].getElementsByTagName("p").length>0)
                {

                    b_paragraph=b_algo[i].getElementsByClassName("b_caption")[0].getElementsByTagName("p")[0].innerText;
                }
                if(website==="facebook")
                {
                    if(/\/people\//.test(b_url)) continue;
                    b_url=b_url.replace(/\/photos\/.*$/,"");
                    console.log("para["+i+"]="+b_paragraph);
                    loc_match=b_paragraph.match(loc_regex);
                    if(loc_match!==null)
                    {

                        if(loc_match[loc_match.length-1].trim().length!==2)
                        {
                            let b_split=b_paragraph.split(" - ");
                            let temp_addr=null;
                            for(j=0; j < b_split.length; j++)
                            {
                                temp_addr=parseAddress.parseLocation(b_split[j]);
                                if(temp_addr)  console.log("temp_addr="+JSON.stringify(temp_addr));
                                if(temp_addr!==null && temp_addr.city!==undefined && temp_addr.state!==undefined)
                                {
                                    loc_match=["",temp_addr.city,temp_addr.state];
                                    break;
                                }
                                console.log("b_split["+j+"]="+b_split[j]);
                                if(loc_regex.test(b_split[j].trim())) {
                                    loc_match=b_split[j].trim().match(loc_regex);
                                    break;
                                }
                            }
                        }
                        console.log("loc_match="+JSON.stringify(loc_match));
                        let length=loc_match.length;
                        if(loc_match.length>=3&&loc_match[length-1].trim().length>0 && loc_match[length-2].trim().length>0 &&
                           ((my_query.state!==loc_match[loc_match.length-1]&&loc_match[loc_match.length-1]!==state_map[my_query.state])  ||

                           (my_query.city.length>0 && my_query.city!==loc_match[loc_match.length-2]))
                          && my_query.name.toLowerCase().indexOf(loc_match[length-3].toLowerCase())===-1 && loc_match[length-1].trim().length < 18
                          )
                        {
                            console.log("Wrong location");
                            continue;
                        }
                        else if(i===0 && loc_match.length===3 && (my_query.city.length>0 && my_query.city===loc_match[loc_match.length-2])  )
                        {
                            console.log("Good location for FB");
                            b1_success=true;
                            break;
                        }
                    }
                    else
                    {
                        console.log("First loc_match is null");
                        b_factrow=b_algo[i].getElementsByClassName("b_factrow");
                        if(b_factrow!==undefined && b_factrow.length>0)
                        {
                            inner_li=b_factrow[0].getElementsByTagName("li");
                            for(j=0; j < inner_li.length; j++)
                            {
                                // console.log("inner_li["+i+"]="+inner_li[i].innerText);
                                loc_match=inner_li[j].innerText.match(loc_re);
                                if(loc_match!==null)
                                {
                                    loc_result=parseAddress.parseLocation(loc_match[1]);
                                    console.log("loc_result="+JSON.stringify(loc_result)+", state_map[my_query.state]="+state_map[my_query.state]+
                                                "\tmy_query.city="+my_query.city);
                                    if(loc_result.state!==undefined && loc_result.state.length>0 &&
                                       (state_map[my_query.state]===loc_result.state || my_query.state===loc_result.state)
                                       &&( loc_result.city!==undefined && (my_query.city.indexOf(loc_result.city)!==-1 || loc_result.city.indexOf(my_query.city)!==-1)
                                          && my_query.city.length>0)
                                      )
                                    {
                                        console.log("Good location for FB");
                            b1_success=true;
                            break;
                                    }
                                }
                            }
                        }
                    }
                }

                
                if(!is_good_entry(website, b_algo[i], first_word, h2_title.replace("'","")))
                {
                    console.log(website+": Bad entry, i="+i+", continuing");
                    //i++;
                    continue;
                }
                else
                {

                    b1_success=true;
                    break;
                }
               


            }
            if(b1_success)
            {
                resolve(JSON.stringify({website: website, url: b_url, error:false}));
            }
            /*else  if(!my_query.reset[website])
            {
                my_query.reset[website]=true;
                return;
            }*/
            else
            {
                console.log(website+": No urls found");

                reject(JSON.stringify({error: true, errorText: "No URLs"}));
            }
        }
        catch(error)
        {

            console.log("Error "+error);
            reject(JSON.stringify({error: true, errorText: error}));
        }
    }

    function reset_name(website)
    {
        var i;

    }



    function is_good_entry(website, b_algo, first_word, h2_title)
    {
        var b_url=b_algo.getElementsByTagName("a")[0].href;
        console.log("h2_title="+h2_title+", my_query.short_name="+my_query.short_name+", index is "+
                    h2_title.toLowerCase().indexOf(my_query.short_name.toLowerCase()));
        h2_title=h2_title.replace(/\sPk(\s|$)/i," Park$1").replace(/\s*&\s*/," and ");
        var short_title=h2_title.replace(/\s*-.*$/,"");
        if(website==="twitter") {
            first_word=first_word.replace(/([A-Z][^A-Z]+).*/,"$1");
            console.log("twitter first_word="+first_word);
        }
        var index1=my_query.name.toLowerCase().indexOf(first_word.toLowerCase());
        if((index1===-1 || (index1!==0 && my_query.name.toLowerCase().indexOf(" "+first_word.toLowerCase())===-1)) &&
          h2_title.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1)
        {
            console.log(website+": first_word="+first_word+", not found in "+my_query.name);
            return false;
        }
        if(b_algo.innerText.toLowerCase().indexOf(my_query.first_word.toLowerCase())===-1
          &&
          h2_title.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1
          )
        {

            if(h2_title.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1)
            {
                console.log(website+": first_word of my query="+my_query.first_word+", not found in "+h2_title);
                console.log("also bad index shit");
                return false;
            }
        }
        if(website==="pinterest" && (h2_title.toLowerCase().indexOf(my_query.state.toLowerCase())===-1 &&
           (!my_query.state in state_map || h2_title.indexOf(state_map[my_query.state])===-1) ) &&
           my_query.name.toLowerCase().indexOf(short_title.toLowerCase())===-1 &&
           short_title.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1)
        {
            console.log(website+": state not found");
            return false;
        }
        if(website==="facebook" && (b_url.indexOf("/public/")!==-1 || b_url.indexOf("/media/")!==-1)) return false;
        if(/Park/i.test(my_query.name) && !/Park/i.test(h2_title)
          && my_query.name.toLowerCase().indexOf(short_title.toLowerCase())===-1 &&
           short_title.toLowerCase().indexOf(my_query.short_name.toLowerCase())===-1

          ) return false;
        return true;
    }

    function camp_search(website,resolve,reject) {
        var search_str="";
        var x;
        if(website!=="facebook")
        {
            var search_name=my_query.short_name;
            for(x in search_replace) search_name=search_name.replace(new RegExp(x,'i'),search_replace[x]);
            search_name=search_name.replace(/\s\s/g," ");
            search_str=""+search_name+" \""+my_query.state+"\" site:"+website+".com";

        }
        else if(website==="facebook")
        {

            search_str=my_query.name+" \""+my_query.state+"\" site:"+website+".com";
        }

 
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
             camp_response(website, response, resolve, reject);
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
        var parsed_str=JSON.parse(to_parse);
        console.log(parsed_str.website+": to_parse="+to_parse);
        console.log("Adding url for "+parsed_str.website);
        parsed_str.url=parsed_str.url.replace(/(https?:\/\/twitter\.com\/[^\/]+)\/.*$/,"$1");
        parsed_str.url=parsed_str.url.replace(/(https?:\/\/www\.facebook\.com\/.*)\/posts.*$/,"$1");
         parsed_str.url=parsed_str.url.replace(/(https?:\/\/www\.facebook\.com\/[^\/]+)\/about.*$/,"$1");
        document.getElementById(parsed_str.website).value=parsed_str.url;

        if(parsed_str.website==="facebook") { my_query.doneFB=true; }
        if(parsed_str.website==="twitter") { my_query.doneTwitter=true; }
        if(parsed_str.website==="youtube") { my_query.doneYoutube=true; }
        if(parsed_str.website==="pinterest") { my_query.donePinterest=true; }
        check_if_done();
        return;

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


    function prefix_in_string(prefixes, to_check)
    {
        var j;
        for(j=0; j < prefixes.length; j++) {
            if(to_check.indexOf(prefixes[j])===0) return true;
        }
        return false;
    }


    function init_Camp()
    {
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
         var inst_body=document.getElementById("instructionBody");
       //inst_body.style.display="block";
        var i;
        var orig_name=wT.rows[0].cells[1].innerText.replace(/^BLM/,"");
        orig_name=orig_name.replace(/(RV Park)(.*)$/,"$1");
        var name=orig_name;
       
        console.log("name="+name);
       // console.log("table.innerText="+wT.innerText+", "+wT.rows.length);
        my_query={name: name, city: wT.rows[1].cells[1].innerText,
                 state: wT.rows[3].cells[1].innerText, doneFB: false, doneTwitter: false, donePinterest: false, doneYoutube: false, first_word: first_word,
                 reset: {"twitter":false,"youtube": false, "facebook": false, "pinterest": false}};
        my_query.orig_name=orig_name;
        my_query.tried_once=false;
        if(my_query.state==="Alaska" && state_map[my_query.city]!==undefined) {
            my_query.state=my_query.city;
            my_query.city=""; }
        var name_split=my_query.name.split(" ");
        var new_name="";
        for(i=0; i < name_split.length; i++)
        {
            if(name_split[i] in replace_words) new_name=new_name+replace_words[name_split[i]];
            else new_name=new_name+name_split[i];
            if(i < name_split.length-1) new_name=new_name+" ";
        }
        my_query.name=new_name;
        if(/^KOA Campground (.*)$/.test(my_query.name))
        {
            my_query.city=my_query.name.match(/^KOA Campground (.*)$/)[1];
        }

        if(my_query.state==="Alaska")
        {
            if(my_query.city==="Yellowknife") my_query.state="Northwest Territories";
        }
        
       /* if(my_query.company.length==0){
            my_query.company=my_query.fname+" "+my_query.lname+" lawyer";
        }*/
        my_query.name=my_query.name.replace(/\s+MH(\s|$)/," Mobile Home$1");
        my_query.name=my_query.name.replace(/\s*&\s*/," and ");
        if(!/Park$/.test(my_query.name))
        {
            my_query.name=my_query.name.replace(/ and .*$/,"")
        }

         if(my_query.name.indexOf("-")!==-1)
        {
            var new_str="";
            var split_query=my_query.name.split(" - ");
            for(i=0; i < split_query.length; i++)
            {
                if((split_query[i].length>new_str.length || split_query[i].trim().array_elem_in_str(key_words)) && !split_query[i].trim().str_in_array(key_words))
                {
                    console.log("split_query[i].trim()="+split_query[i].trim()+", split_query[i].trim().str_in_array(key_words)="+split_query[i].trim().str_in_array(key_words));
                    new_str=split_query[i];
                }
                if(new_str.array_elem_in_str(key_words))
                {
                    break;
                }
            }
            my_query.name=new_str;
        }


       my_query.short_name=my_query.name.replace(/ at .*$/,"");
        var first_word=my_query.name.split(" ")[0];
        my_query.first_word=first_word;

      

         console.log("my_query="+JSON.stringify(my_query));
        first_try=true;


        var search_str, search_URI, search_URIBing;

        const campPromiseFB = new Promise((resolve, reject) => {
            console.log("Beginning camp search for FB");
            camp_search("facebook",resolve, reject);
        });
        const campPromiseTwitter = new Promise((resolve, reject) => {
            console.log("Beginning camp search for Twitter");
            camp_search("twitter",resolve, reject);
        });
        const campPromiseYoutube = new Promise((resolve, reject) => {
            console.log("Beginning camp search for Youtube");
            camp_search("youtube",resolve, reject);
        });
        const campPromisePinterest = new Promise((resolve, reject) => {
            console.log("Beginning camp search for Youtube");
            camp_search("pinterest",resolve, reject);
        });
        campPromiseFB.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed  FB" + val); add_not_listed("facebook"); my_query.doneFB=true; check_if_done(); });
        campPromiseTwitter.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed  Twitter" + val); add_not_listed("twitter"); my_query.doneTwitter=true; check_if_done(); });
        campPromiseYoutube.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed  Youtube" + val); add_not_listed("youtube"); my_query.doneYoutube=true; check_if_done(); });
        campPromisePinterest.then(camp_promise_then
        )
        .catch(function(val) {
           console.log("Failed Pinterest" + val); add_not_listed("pinterest"); my_query.donePinterest=true; check_if_done(); });






    }
    function add_not_listed(website)
    {
        var to_add=document.getElementById(website);
        to_add.value="Not Listed";
        return;
    }
    function check_if_done()
    {
        if(my_query.doneFB && my_query.doneTwitter && my_query.doneYoutube && my_query.donePinterest)
        {
            console.log("Done with all queries");
            check_and_submit();
        }
        else
        {
            console.log("Not done yet");
        }
        return;
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