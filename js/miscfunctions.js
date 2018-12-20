/** 
 * Repository for miscellaneous useful functions not (yet?) in MTurkScript condition 
 */


/** 
 * do_CDE parses cde.ca.gov, partially, can be improved
 */
function do_CDE(response)
{

    var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
    var result={addressLine1:"NA",city:"NA",zip:"NA",teamMemberFName:"NA",teamMemberLName:"NA"};

    var i,curr_row,j;
    var label, value;

    var table=doc.getElementsByClassName("table")[0];
    for(i=0; i < table.rows.length; i++)
    {
        curr_row=table.rows[i];
        label=curr_row.cells[0].innerText.trim();
        value=curr_row.cells[1];
        if(label==="Web Address") my_query.newLink=value.innerText.trim();
        if(label==="District Address")
        {
            let temp_addr=value.getElementsByClassName("disable-ios-link")[0].innerText;
            temp_addr=temp_addr.replace(/\n\n+/g,"\n");
            temp_addr=temp_addr.replace(/^\n/g,"");
            let temp_split=temp_addr.split("\n");
            console.log("temp_split="+temp_split);
            if(temp_split.length>0)
            {
                result.addressLine1=temp_split[0].trim();
            }
            if(temp_split.length>1)
            {
                let place_regex=/([^,]+),\s*([A-Z]{2})\s*(.*)$/;
                let place_match=temp_split[1].trim().match(place_regex);
                if(place_match!==null)
                {
                    result.city=place_match[1];
                    result.state=place_match[2];
                    result.zip=place_match[3];
                }

            }

        }
        if(label==="Chief Business Official")
        {
            let value_text=value.innerText.trim();
            let value_split=value_text.split("\n");
            if(value_split.length>0)
            {
                var fullname=parse_name(value_split[0]);
                result.teamMemberFName=fullname.fname;
                result.teamMemberLName=fullname.lname;
                result.title="BM";
            }
            for(j=1; j < value_split.length; j++)
            {
                if(email_re.test(value_split[j])) result.email=value_split[j];
                else if(phone_re.test(value_split[j]))
                {
                    let temp_phone=value_split[j].replace(/[^\d]+/g,"");
                    if(temp_phone.length>10) result.ext=temp_phone.substr(10);
                    result.phoneNumber=temp_phone.substr(0,10).replace(/([\d]{3})([\d]{3})([\d]{4})/,"$1-$2-$3");
                }
            }
        }


    }
    var x;
    for(x in result)
    {
        document.getElementById(x).value=result[x];
    }
}
/** 
 * check loc_hy location on bing search
 */
function check_loc_hy(loc_hy)
{
    console.log("Checking loc_hy");
    var i;
    var entityContent=loc_hy.getElementsByClassName("entityContent");
    var phone_match;
    for(i=0; i < entityContent.length; i++)
    {
        phone_match=entityContent[i].innerText.match(phone_re);
        if(phone_match!==null) {
            add_and_submit(phone_match[0]);
            return true;
        }
    }
    return false;
}


/** 
 * Functions for SEC parsing 
 */
function SEC1_response(response) {
    var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
    var table=doc.getElementsByClassName("tableFile2"),i,curr_row;
    var new_url;
    if(table.length==0) {
        console.log("Failed to find table in SEC1");
        GM_setValue("returnHit",true);
        return; }
    table=table[0];
    for(i=1; i < table.rows.length; i++)
    {
        curr_row=table.rows[i];
        if(/^C/.test(curr_row.cells[0].innerText))
        {
            new_url=curr_row.cells[1].getElementsByTagName("a")[0].href;
            new_url=new_url.replace(/https?:\/\/[^\/]+\//,"https://www.sec.gov/");
            console.log("new_url="+new_url);
            GM_xmlhttpRequest({method: 'GET', url: new_url,
                               onload: function(response) { SEC2_response(response); },
                               onerror: function(response) { console.log("SEC Fail"); },
                               ontimeout: function(response) { console.log("SEC Fail"); }
                              });
            return;
        }
    }
    console.log("Failed to find C in table in SEC1");
    GM_setValue("returnHit",true); return;
}

function SEC2_response(response) {
    var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
    var table=doc.getElementsByClassName("tableFile"),i,curr_row;
    var new_url;
    if(table.length==0) {
        console.log("Failed to find table in SEC1");
        GM_setValue("returnHit",true);
        return; }
    table=table[0];
    for(i=1; i < table.rows.length; i++)
    {
        curr_row=table.rows[i];

        new_url=curr_row.cells[2].getElementsByTagName("a")[0].href;
        new_url=new_url.replace(/https?:\/\/[^\/]+\//,"https://www.sec.gov/");
        console.log("new_url="+new_url);
        GM_xmlhttpRequest({method: 'GET', url: new_url,
                           onload: function(response) { SEC3_response(response); },
                           onerror: function(response) { console.log("SEC Fail"); },
                           ontimeout: function(response) { console.log("SEC Fail"); }
                          });
        return;

    }
    console.log("Failed to find C in table in SEC1");
    GM_setValue("returnHit",true); return;
}

function SEC3_response(response) {
    var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
    var url,name="",email="",phone="",intermediary="";
    var fakeBox=doc.getElementsByClassName("fakeBox"),fakeBox2=doc.getElementsByClassName("fakeBox2"),
        fakeBox3=doc.getElementsByClassName("fakeBox3");
    document.getElementById("companyName").value=fakeBox[1].innerText;
    url=fakeBox3[2].innerText;
    name=fakeBox3[0].innerText;
    phone=fakeBox2[3].innerText;
    email=fakeBox[0].innerText;
    intermediary=fakeBox[9].innerText;
    if(name.length===0) name=fakeBox3[6].innerText;
    if(!/^http/.test(url)) url="https://"+url;
    document.getElementsByName("teamMemberName")[0].value=url;
    document.getElementById("email").value=email;
    document.getElementsByName("teamMemberName")[1].value=name;
    document.getElementById("phoneNumber").value=phone;
    document.getElementsByName("teamMemberName")[2].value=intermediary;
    check_and_submit(check_function,automate);




}


function call_SEC(company_name)
{
    var url="https://www.sec.gov/cgi-bin/browse-edgar?company="+company_name.replace(/\s/g,"+")+"&owner=exclude&action=getcompany";
    GM_xmlhttpRequest({method: 'GET', url: url,
                       onload: function(response) { SEC1_response(response); },
                       onerror: function(response) { console.log("SEC Fail"); },
                       ontimeout: function(response) { console.log("SEC Fail"); }
                      });
}
