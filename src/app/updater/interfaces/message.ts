// import * as html from "@angular/compiler/src/ml_parser/ast";
import {LogLevel} from './log-level';

export interface Message {
  position: number;
  message: string;
  length: number;
  url?: string;
  level: LogLevel;
}

export interface MessageDetail {
  message: string;
  pos: {character: number; line: number};
  length: number;
  url?: string;
  level: LogLevel;
}
