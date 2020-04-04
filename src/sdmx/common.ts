/*
    This file is part of sdmx-js.

    sdmx-js is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    sdmx-js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with sdmx-js.  If not, see <http://www.gnu.org/licenses/>.
    Copyright (C) 2016 James Gardner
*/
import * as commonreferences from '../sdmx/commonreferences';
import * as xml from '../sdmx/xml';
export class TextType {
    private lang: string = "";
    private text: string = "";
    constructor(lang: string, text: string) {
        this.lang = lang;
        this.text = text;
    }
    public getLang(): string {
        return this.lang;
    }
    public getText(): string {
        return this.text;
    }
    public setText(s: string) {
        this.text = s;
    }
    public setLang(s: string) {
        this.lang = s;
    }
}
export class Annotation {
    public annotationTitle: string = "";
    public annotationType: string = "";
    public annotationUrl: string = "";
    public annotationText: TextType[];
    public id: string;
}
export class Annotations {
    private annotations: Annotation[] = null;
    public getAnnotations(): Annotation[] {
        return this.annotations;
    }
    public setAnnotations(a: Annotation[]) {
        this.annotations = a;
    }
}
export class AnnotableType {
    public annotations: Annotations;
    constructor() {
    }
    getAnnotations(): Annotations {
        return this.annotations;
    }
    setAnnotations(annots: Annotations) {
        this.annotations = annots;
    }
}

export class Description extends TextType {
    constructor(lang: string, text: string) {
        super(lang, text);
    }
}

export class Name extends TextType {
    constructor(lang: string, text: string) {
        super(lang, text);
    }
}
export class ObservationDimensionType extends commonreferences.NCNameID {
    private code: commonreferences.ObsDimensionsCodeType = null;
    constructor(s: string) {
        super(s);
        //  if (commonreferences.ObsDimensionsCodeType.ALL_DIMENSIONS_TEXT.equals(s)) {
        //      this.code = commonreferences.ObsDimensionsCodeType.fromString(s);
        //  } else if (commonreferences.ObsDimensionsCodeType.TIME_PERIOD_TEXT.equals(s)) {
        //      this.code = commonreferences.ObsDimensionsCodeType.fromString(s);
        //  }
    }
    public toString(): string { return this.code != null ? this.code.toString() : super.toString(); }
}
export class ActionType {
    /*
     * DO ME! Add Proper codes for this class
     * 
     * 
     */
    public static ENUM: Array<ActionType> = new Array<ActionType>();
    public static STRING_ENUM: Array<string> = new Array<string>();

    public static APPEND_TEXT: string = ActionType.addString("Append");
    public static REPLACE_TEXT: string = ActionType.addString("Replace");
    public static DELETE_TEXT: string = ActionType.addString("Delete");
    public static INFORMATION_TEXT: string = ActionType.addString("Information");
    public static APPEND: ActionType = new ActionType(ActionType.APPEND_TEXT);
    public static REPLACE: ActionType = new ActionType(ActionType.REPLACE_TEXT);
    public static DELETE: ActionType = new ActionType(ActionType.DELETE_TEXT);
    public static INFORMATION: ActionType = new ActionType(ActionType.INFORMATION_TEXT);
    // Utility
    private static add(s: string): ActionType {
        var b: ActionType = new ActionType(s);
        ActionType.ENUM.push(b);
        return b;
    }
    private static addString(s: string): string {
        ActionType.STRING_ENUM.push(s);
        return s;
    }

    public static fromString(s: string): ActionType {
        for (var i = 0; i < ActionType.ENUM.length; i++) {
            if (ActionType.ENUM[i].target == s) return ActionType.ENUM[i];
        }
        return null;
    }
    public static fromStringWithException(s: string): ActionType {
        for (var i = 0; i < ActionType.ENUM.length; i++) {
            if (ActionType.ENUM[i].target == s) return ActionType.ENUM[i];
        }
        throw new Error("Value:" + s + " not found in ActionType enumeration!");
    }
    // Instance
    private target: string = null;
    constructor(s: string) {
        var contains: boolean = false;
        for (var i = 0; i < ActionType.STRING_ENUM.length; i++) {
            if (ActionType.STRING_ENUM[i] == s) {
                contains = true;
            }
        }
        if (!contains) throw new Error(s + " is not a valid ActionType");
        this.target = s;
    }
    public toString(): string { return this.target; }
}
export class PayloadStructureType {
    private structureID: commonreferences.ID = null;
    private schemaURL: xml.anyURI = null;
    private namespace: xml.anyURI = null;
    private dimensionAtObservation: ObservationDimensionType = null;
    private explicitMeasures: boolean = false;
    private serviceURL: xml.anyURI = null;
    private structureURL: xml.anyURI = null;

    // Choice of 1
    private provisionAgreement: commonreferences.Reference;
    private structureUsage: commonreferences.Reference;
    private structure: commonreferences.Reference;
    public setStructure(ref:commonreferences.Reference) {
        this.structure=ref;
    }
    public getStructure():commonreferences.Reference { return this.structure; }
}

export class ObservationalTimePeriodType {
    // Year
    public static PATTERN_YEAR: string = ".{5}A1.*";
    // Semester
    public static PATTERN_SEMESTER: string = ".{5}S[1-2].*";
    // Trimester
    public static PATTERN_TRIMESTER: string = ".{5}T[1-3].*";
    // Quarter
    public static PATTERN_QUARTER: string = ".{5}Q[1-4].*";
    // Month
    public static PATTERN_MONTH: string = ".{5}M(0[1-9]|1[0-2]).*";
    // Week
    public static PATTERN_WEEK: string = ".{5}W(0[1-9]|[1-4][0-9]|5[0-3]).*";
    // Day
    public static PATTERN_DAY: string = ".{5}D(0[0-9][1-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-6]).*";

    public static YEAR: number = 1;
    public static SEMESTER: number = 2;
    public static TRIMESTER: number = 3;
    public static QUARTER: number = 4;
    public static MONTH: number = 5;
    public static WEEK: number = 6;
    public static DAY: number = 7;

    private state: number = ObservationalTimePeriodType.YEAR;
    private value: string = null;

    constructor(s: string) {
        this.value = s;
        if (s.match(ObservationalTimePeriodType.PATTERN_YEAR).length > 0) {
            this.state = ObservationalTimePeriodType.YEAR;
        }
        if (s.match(ObservationalTimePeriodType.PATTERN_SEMESTER).length > 0) {
            this.state = ObservationalTimePeriodType.SEMESTER;
        }
        if (s.match(ObservationalTimePeriodType.PATTERN_TRIMESTER).length > 0) {
            this.state = ObservationalTimePeriodType.TRIMESTER;
        }
        if (s.match(ObservationalTimePeriodType.PATTERN_QUARTER).length > 0) {
            this.state = ObservationalTimePeriodType.QUARTER;
        }
        if (s.match(ObservationalTimePeriodType.PATTERN_MONTH).length > 0) {
            this.state = ObservationalTimePeriodType.MONTH;
        }
        if (s.match(ObservationalTimePeriodType.PATTERN_WEEK).length > 0) {
            this.state = ObservationalTimePeriodType.WEEK;
        }
        if (s.match(ObservationalTimePeriodType.PATTERN_DAY).length > 0) {
            this.state = ObservationalTimePeriodType.DAY;
        }
    }
    public toString(): string {
        return this.value;
    }
    public getState(): number {
        return this.state;
    }
}
export class ExternalReferenceAttributeGroup {
    private serviceURL: string = null;
    private structureURL: string = null;


    constructor() { }

    /**
     * @return the serviceURL
     */
    getServiceURL(): string {
        return this.serviceURL;
    }

    setServiceURL(serviceURL: string) {
        this.serviceURL = serviceURL;
    }

    getStructureURL(): string {
        return this.structureURL;
    }

    /**
     * @param structureURL the structureURL to set
     */
    setStructureURL(structureURL: string) {
        this.structureURL = structureURL;
    }
}
export class DataType {

    public static ENUM: Array<DataType> = new Array<DataType>();
    public static STRING_ENUM: Array<string> = new Array<string>();

    public static STRING_TEXT: string = DataType.addString("String");
    public static ALPHA_TEXT: string = DataType.addString("Alpha");
    public static ALPHANUMERIC_TEXT: string = DataType.addString("AlphaNumeric");
    public static NUMERIC_TEXT: string = DataType.addString("Numeric");
    public static BIGINTEGER_TEXT: string = DataType.addString("BigInteger");
    public static INTEGER_TEXT: string = DataType.addString("Integer");
    public static LONG_TEXT: string = DataType.addString("Long");
    public static SHORT_TEXT: string = DataType.addString("Short");
    public static DECIMAL_TEXT: string = DataType.addString("Decimal");
    public static FLOAT_TEXT: string = DataType.addString("Float");
    public static DOUBLE_TEXT: string = DataType.addString("Double");
    public static BOOLEAN_TEXT: string = DataType.addString("Boolean");
    public static URI_TEXT: string = DataType.addString("URI");
    public static COUNT_TEXT: string = DataType.addString("Count");
    public static INCLUSIVEVALUERANGE_TEXT: string = DataType.addString("InclusiveValueRange");
    public static EXCLUSIVEVALUERANGE_TEXT: string = DataType.addString("ExclusiveValueRange");
    public static INCREMENTAL_TEXT: string = DataType.addString("Incremental");
    public static OBSERVATIONAL_TIMEPERIOD_TEXT: string = DataType.addString("ObservationalTimePeriod");
    public static STANDARD_TIMEPERIOD_TEXT: string = DataType.addString("StandardTimePeriod");
    public static BASIC_TIMEPERIOD_TEXT: string = DataType.addString("BasicTimePeriod");
    public static GREGORIAN_TIMEPERIOD_TEXT: string = DataType.addString("GregorianTimePeriod");
    public static GREGORIAN_YEAR_TEXT: string = DataType.addString("GregorianYear");
    public static GREGORIAN_YEARMONTH_TEXT: string = DataType.addString("GregorianYearMonth");
    public static GREGORIAN_DAY_TEXT: string = DataType.addString("GregorianDay");
    public static REPORTING_TIMEPERIOD_TEXT: string = DataType.addString("ReportingTimePeriod");
    public static REPORTING_YEAR_TEXT: string = DataType.addString("ReportingYear");
    public static REPORTING_SEMESTER_TEXT: string = DataType.addString("ReportingSemester");
    public static REPORTING_TRIMESTER_TEXT: string = DataType.addString("ReportingTrimester");
    public static REPORTING_QUARTER_TEXT: string = DataType.addString("ReportingQuarter");
    public static REPORTING_MONTH_TEXT: string = DataType.addString("ReportingMonth");
    public static REPORTING_WEEK_TEXT: string = DataType.addString("ReportingWeek");
    public static REPORTING_DAY_TEXT: string = DataType.addString("ReportingDay");
    public static DATETIME_TEXT: string = DataType.addString("DateTime");
    public static TIMERANGE_TEXT: string = DataType.addString("TimeRange");
    public static MONTH_TEXT: string = DataType.addString("Month");
    public static MONTH_DAY_TEXT: string = DataType.addString("MonthDay");
    public static DAY_TEXT: string = DataType.addString("Day");
    public static TIME_TEXT: string = DataType.addString("Time");
    public static DURATION_TEXT: string = DataType.addString("Duration");
    public static XHTML_TEXT: string = DataType.addString("XHTML");
    public static KEYVALUES_TEXT: string = DataType.addString("KeyValues");
    public static IDENTIFIABLE_REFERENCE_TEXT: string = DataType.addString("IdentifiableReference");
    public static DATASET_REFERENCE_TEXT: string = DataType.addString("DataSetReference");
    public static ATTACHMENT_CONSTRAINT_REFERENCE_TEXT: string = DataType.addString("AttachmentConstraintReference");
    public static STRING: DataType = DataType.add("String");
    public static ALPHA: DataType = DataType.add("Alpha");
    public static ALPHANUMERIC: DataType = DataType.add("AlphaNumeric");
    public static NUMERIC: DataType = DataType.add("Numeric");
    public static BIGINTEGER: DataType = DataType.add("BigInteger");
    public static INTEGER: DataType = DataType.add("Integer");
    public static LONG: DataType = DataType.add("Long");
    public static SHORT: DataType = DataType.add("Short");
    public static DECIMAL: DataType = DataType.add("Decimal");
    public static FLOAT: DataType = DataType.add("Float");
    public static DOUBLE: DataType = DataType.add("Double");
    public static BOOLEAN: DataType = DataType.add("Boolean");
    public static URI: DataType = DataType.add("URI");
    public static COUNT: DataType = DataType.add("Count");
    public static INCLUSIVEVALUERANGE: DataType = DataType.add("InclusiveValueRange");
    public static EXCLUSIVEVALUERANGE: DataType = DataType.add("ExclusiveValueRange");
    public static INCREMENTAL: DataType = DataType.add("Incremental");
    public static OBSERVATIONAL_TIMEPERIOD: DataType = DataType.add("ObservationalTimePeriod");
    public static STANDARD_TIMEPERIOD: DataType = DataType.add("StandardTimePeriod");
    public static BASIC_TIMEPERIOD: DataType = DataType.add("BasicTimePeriod");
    public static GREGORIAN_TIMEPERIOD: DataType = DataType.add("GregorianTimePeriod");
    public static GREGORIAN_YEAR: DataType = DataType.add("GregorianYear");
    public static GREGORIAN_YEARMONTH: DataType = DataType.add("GregorianYearMonth");
    public static GREGORIAN_DAY: DataType = DataType.add("GregorianDay");
    public static REPORTING_TIMEPERIOD: DataType = DataType.add("ReportingTimePeriod");
    public static REPORTING_YEAR: DataType = DataType.add("ReportingYear");
    public static REPORTING_SEMESTER: DataType = DataType.add("ReportingSemester");
    public static REPORTING_TRIMESTER: DataType = DataType.add("ReportingTrimester");
    public static REPORTING_QUARTER: DataType = DataType.add("ReportingQuarter");
    public static REPORTING_MONTH: DataType = DataType.add("ReportingMonth");
    public static REPORTING_WEEK: DataType = DataType.add("ReportingWeek");
    public static REPORTING_DAY: DataType = DataType.add("ReportingDay");
    public static DATETIME: DataType = DataType.add("DateTime");
    public static TIMERANGE: DataType = DataType.add("TimeRange");
    public static MONTH: DataType = DataType.add("Month");
    public static MONTH_DAY: DataType = DataType.add("MonthDay");
    public static DAY: DataType = DataType.add("Day");
    public static TIME: DataType = DataType.add("Time");
    public static DURATION: DataType = DataType.add("Duration");
    public static XHTML: DataType = DataType.add("XHTML");
    public static KEYVALUES: DataType = DataType.add("KeyValues");
    public static IDENTIFIABLE_REFERENCE: DataType = DataType.add("IdentifiableReference");
    public static DATASET_REFERENCE: DataType = DataType.add("DataSetReference");
    public static ATTACHMENT_CONSTRAINT_REFERENCE: DataType = DataType.add("AttachmentConstraintReference");

    // Utility
    private static add(s: string): DataType {
        var b: DataType = new DataType(s);
        DataType.ENUM.push(b);
        return b;
    }
    private static addString(s: string): string {
        DataType.STRING_ENUM.push(s);
        return s;
    }

    public static fromString(s: string): DataType {
        for (var i: number = 0; i < DataType.ENUM.length; i++) {
            if (DataType.ENUM[i].target == s) return DataType.ENUM[i];
        }
        return null;
    }
    public static fromStringWithException(s: string): DataType {
        for (var i: number = 0; i < DataType.ENUM.length; i++) {
            if (DataType.ENUM[i].target == s) return DataType.ENUM[i];
        }
        throw new Error("Value:" + s + " not found in enumeration! - DataType");
    }
    // Instance
    private target: string = null;
    private index: number = -1;
    public constructor(s: string) {
        var contains: boolean = false;
        for (var i = 0; i < DataType.STRING_ENUM.length; i++) {
            if (DataType.STRING_ENUM[i] == s) {
                contains = true;
            }
        }
        if (!contains) throw new Error(s + " is not a valid DataType");
        this.target = s;
        this.index = DataType.STRING_ENUM.indexOf(s);
    }
    public toString(): string { return this.target; }
    public toInt(): number {
        return this.index;
    }
}
export class StandardTimePeriodType {}