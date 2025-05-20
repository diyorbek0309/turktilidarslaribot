module.exports =  class Utils {
    static escapeMarkdown(text) {
        return text
            .replace(/_/g, "\\_")
            .replace(/\*/g, "\\*")
            .replace(/\[/g, "\\[")
            .replace(/\]/g, "\\]")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)")
            .replace(/~/g, "\\~")
            .replace(/`/g, "\\`")
            .replace(/>/g, "\\>")
            .replace(/#/g, "\\#")
            .replace(/\+/g, "\\+")
            .replace(/-/g, "\\-")
            .replace(/=/g, "\\=")
            .replace(/\|/g, "\\|")
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            .replace(/\./g, "\\.")
            .replace(/!/g, "\\!");
    }
}