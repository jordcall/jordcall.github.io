#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'now.html');
const currentStartMarker = '<!-- CURRENT-NOW-START -->';
const currentEndMarker = '<!-- CURRENT-NOW-END -->';
const archiveStartMarker = '<!-- ARCHIVE-START -->';
const archiveEndMarker = '<!-- ARCHIVE-END -->';

const monthLookup = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12
};

function logEvent(name, details) {
    if (details) {
        console.log(name, details);
        return;
    }
    console.log(name);
}

function getNewline(text) {
    return text.includes('\r\n') ? '\r\n' : '\n';
}

function getIndent(text, index, newline) {
    const lineStart = text.lastIndexOf(newline, index);
    const start = lineStart === -1 ? 0 : lineStart + newline.length;
    const linePrefix = text.slice(start, index);
    const match = linePrefix.match(/^\s*/);
    return match ? match[0] : '';
}

function extractBlock(text, startMarker, endMarker, newline) {
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
        throw new Error(`Missing markers: ${startMarker} / ${endMarker}`);
    }
    const startLineEnd = text.indexOf(newline, startIndex);
    const endLineStart = text.lastIndexOf(newline, endIndex);
    if (startLineEnd === -1 || endLineStart === -1) {
        throw new Error(`Malformed marker block: ${startMarker}`);
    }
    return {
        startIndex,
        endIndex,
        startLineEnd,
        endLineStart,
        block: text.slice(startLineEnd + newline.length, endLineStart)
    };
}

function replaceBlock(text, startLineEnd, endLineStart, newline, newBlock) {
    return text.slice(0, startLineEnd + newline.length) + newBlock + newline + text.slice(endLineStart);
}

function trimEmptyLines(text, newline) {
    const lines = text.split(/\r?\n/);
    while (lines.length && !lines[0].trim()) {
        lines.shift();
    }
    while (lines.length && !lines[lines.length - 1].trim()) {
        lines.pop();
    }
    return lines.join(newline);
}

function dedent(text) {
    const lines = text.split(/\r?\n/);
    const indents = lines
        .filter(line => line.trim())
        .map(line => line.match(/^\s*/)[0].length);
    const minIndent = indents.length ? Math.min(...indents) : 0;
    return lines.map(line => line.slice(minIndent)).join('\n');
}

function indentLines(text, indent, newline) {
    return text.split(/\r?\n/).map(line => {
        if (!line.trim()) {
            return '';
        }
        return `${indent}${line}`;
    }).join(newline);
}

function formatArchiveDate(match) {
    const monthRaw = match[1].toLowerCase();
    const day = Number(match[2]);
    const year = Number(match[3]);
    const month = monthLookup[monthRaw] || monthLookup[monthRaw.slice(0, 3)];
    if (!month || !day || !year) {
        throw new Error('Unable to parse Updated date');
    }
    const paddedMonth = String(month).padStart(2, '0');
    const paddedDay = String(day).padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
}

function formatDisplayDate(isoDate) {
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) {
        throw new Error('Invalid archive date format');
    }
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid archive date value');
    }
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatUpdatedLine(date) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `Updated ${monthName} ${day}, ${year}`;
}

function buildArchiveEntry(dateString, displayDate, bodyContent, indent, newline) {
    const bodyIndent = `${indent}  `;
    const body = bodyContent ? indentLines(bodyContent, bodyIndent, newline) : '';
    const lines = [
        `${indent}<section class="now-archive-entry" id="now-${dateString}">`,
        `${indent}  <div class="now-archive-date">${displayDate}</div>`
    ];
    if (body) {
        lines.push(body);
    }
    lines.push(
        `${indent}</section>`
    );
    return lines.join(newline);
}

function buildCurrentTemplate(indent, newline) {
    const updatedLine = formatUpdatedLine(new Date());
    return [
        `${indent}<p class="now-updated"><em>${updatedLine}</em></p>`,
        '',
        `${indent}<div class="now-item-current">`,
        `${indent}  <h3 class="now-item-title">Replace with current focus</h3>`,
        `${indent}  <div class="now-item-body">`,
        `${indent}    <p>Write the new update here.</p>`,
        `${indent}  </div>`,
        `${indent}</div>`
    ].join(newline);
}

function main() {
    try {
        logEvent('now_archive_start');
        const content = fs.readFileSync(filePath, 'utf8');
        const newline = getNewline(content);

        const currentBlockInfo = extractBlock(content, currentStartMarker, currentEndMarker, newline);
        const archiveBlockInfo = extractBlock(content, archiveStartMarker, archiveEndMarker, newline);

        const updatedMatch = currentBlockInfo.block.match(/Updated\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/i);
        if (!updatedMatch) {
            throw new Error('Could not find Updated date in current section');
        }

        const archiveDate = formatArchiveDate(updatedMatch);
        const displayDate = formatDisplayDate(archiveDate);
        logEvent('now_archive_parsed_date', { date: archiveDate });

        const currentWithoutUpdated = currentBlockInfo.block.replace(
            /<p[^>]*class=["']now-updated["'][^>]*>[\s\S]*?<\/p>\s*/i,
            ''
        ).trim();
        const dedentedCurrent = dedent(trimEmptyLines(currentWithoutUpdated, newline))
            .replace(/<div\s+class=["']now-item-current["']>/gi, '<details class=\"now-item\">')
            .replace(/<h[23]\s+class=["']now-item-title["']>([\s\S]*?)<\/h[23]>/gi, '<summary>$1</summary>')
            .replace(/<\/div>\s*<\/div>/gi, '</div></details>');

        const archiveIndent = getIndent(content, archiveBlockInfo.startIndex, newline);
        const currentIndent = getIndent(content, currentBlockInfo.startIndex, newline);

        const archiveEntry = buildArchiveEntry(archiveDate, displayDate, dedentedCurrent, archiveIndent, newline);
        const existingArchiveBlock = trimEmptyLines(archiveBlockInfo.block, newline);
        const newArchiveBlock = existingArchiveBlock
            ? [archiveEntry, existingArchiveBlock].join(`${newline}${newline}`)
            : archiveEntry;

        let updatedContent = replaceBlock(
            content,
            archiveBlockInfo.startLineEnd,
            archiveBlockInfo.endLineStart,
            newline,
            newArchiveBlock
        );
        logEvent('now_archive_inserted');

        const newCurrentBlock = buildCurrentTemplate(currentIndent, newline);
        updatedContent = replaceBlock(
            updatedContent,
            currentBlockInfo.startLineEnd,
            currentBlockInfo.endLineStart,
            newline,
            newCurrentBlock
        );

        fs.writeFileSync(filePath, updatedContent, 'utf8');
        logEvent('now_archive_done');
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
