/*
 * dsh-search-mcp — browser half.
 *
 * Surfaces (matching dsh-im-ops / netxops on Desktop 0.2):
 * - Always register `settings.section` (Settings sidebar).
 * - Soft-attach real form scopes into a deferred memory scope for Save.
 * - Optional `plugins.item` when configForms attaches.
 * - Do NOT use `settings.plugin.item` — missing on Desktop 0.2 and kills boot.
 *
 * Form: structured (no raw JSON) — default server, max results, timeout,
 * quick-add presets, collapsible server rows.
 *
 * Loaded through window.__ModuleLoader__ like every shipped client bundle.
 */
window.__ModuleLoader__.load({
	id: "dsh-search-mcp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		if (react && react.default && typeof react.default.useState === "function") {
			react = react.default;
		}
		let react_jsx_runtime = require("react/jsx-runtime");
		if (react_jsx_runtime && react_jsx_runtime.default && typeof react_jsx_runtime.default.jsx === "function") {
			react_jsx_runtime = react_jsx_runtime.default;
		}
		// Prefer createElement (ops-cron path) — some Desktop ModuleLoader builds
		// expose a partial jsx-runtime where jsx/jsxs are missing on the namespace.
		const h = typeof react.createElement === "function"
			? react.createElement.bind(react)
			: null;
		const jsx = typeof react_jsx_runtime.jsx === "function"
			? react_jsx_runtime.jsx
			: (type, props, key) => {
				if (!h) throw new Error("dsh-search-mcp: react.createElement unavailable");
				if (type == null) throw new Error("dsh-search-mcp: jsx type is " + type);
				const p = props ? { ...props } : {};
				if (key !== undefined) p.key = key;
				const kids = p.children;
				delete p.children;
				return kids === undefined ? h(type, p) : h(type, p, kids);
			};
		const jsxs = typeof react_jsx_runtime.jsxs === "function"
			? react_jsx_runtime.jsxs
			: jsx;
		react_jsx_runtime = { jsx, jsxs, Fragment: react_jsx_runtime.Fragment || react.Fragment };
		// Desktop 0.2 may not seed ui-primitives / dsh-client-store in the ModuleLoader
		// table. Soft-require + local fallbacks so import never fails web boot.
		let _deepseek_ai_dsh_client_ui_primitives = {};
		try {
			_deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch {
			_deepseek_ai_dsh_client_ui_primitives = {};
		}
		if (
			_deepseek_ai_dsh_client_ui_primitives
			&& _deepseek_ai_dsh_client_ui_primitives.default
			&& typeof _deepseek_ai_dsh_client_ui_primitives.default === "object"
		) {
			_deepseek_ai_dsh_client_ui_primitives = {
				..._deepseek_ai_dsh_client_ui_primitives.default,
				..._deepseek_ai_dsh_client_ui_primitives,
			};
		}
		// Always use a local chevron — never trust ModuleLoader primitives for element types
		// (React #130 = rendering undefined as a component).
		function IconChevronDownOutline14(props) {
			return jsx("svg", {
				viewBox: "0 0 14 14",
				width: "14",
				height: "14",
				"aria-hidden": "true",
				className: props && props.className,
				children: jsx("path", {
					d: "M3.5 5.25L7 8.75L10.5 5.25",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					strokeLinejoin: "round",
				}),
			});
		}
		_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14 = IconChevronDownOutline14;
		function createSnapshotStoreFallback(initial) {
			let state = initial;
			const listeners = new Set();
			return {
				getSnapshot() {
					return state;
				},
				subscribe(listener) {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
				set(next) {
					state = next;
					for (const listener of listeners) {
						try { listener(); } catch { /* ignore */ }
					}
				},
			};
		}
		const createSnapshotStore = createSnapshotStoreFallback;
		const _deepseek_ai_dsh_client_runtime_client = { createSnapshotStore };

		//#region styles
		const css = [
			".smcp_section{display:flex;flex-direction:column;gap:12px;padding:4px 0 24px}",
			".smcp_lede{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:1.5}",
			".smcp_bodyFlat{border-top:none;margin:0;padding:0}",
			".smcp_card{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}",
			".smcp_card:hover{border-color:var(--dsw-alias-label-dimmed)}",
			".smcp_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
			".smcp_headBtn{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}",
			".smcp_headBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
			".smcp_head{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}",
			".smcp_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}",
			".smcp_desc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}",
			".smcp_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}",
			".smcp_chevronOpen{transform:rotate(180deg)}",
			".smcp_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px;display:flex;flex-direction:column;gap:0}",
			".smcp_field{display:flex;flex-direction:column;gap:6px;padding:12px 0}",
			".smcp_field + .smcp_field{border-top:1px solid var(--dsw-alias-border-l2)}",
			".smcp_label{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}",
			".smcp_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}",
			".smcp_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}",
			".smcp_input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}",
			".smcp_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 8px;font-size:13px;line-height:1.5}",
			".smcp_select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}",
			".smcp_invalid{border-color:var(--dsw-alias-label-error)}",
			".smcp_error{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}",
			".smcp_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}",
			".smcp_badgeMuted{white-space:nowrap;color:var(--dsw-alias-label-tertiary);border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px}",
			".smcp_badgeDanger{white-space:nowrap;color:var(--dsw-alias-label-error);border:1px solid var(--dsw-alias-label-error);border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px}",
			".smcp_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}",
			".smcp_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}",
			".smcp_reset:disabled{cursor:default}",
			".smcp_footer{display:flex;justify-content:flex-end;align-items:center;gap:8px;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l2)}",
			".smcp_btn{appearance:none;font:inherit;cursor:pointer;border:1px solid transparent;border-radius:8px;padding:5px 12px;height:auto;min-height:32px;font-size:13px;line-height:1.5}",
			/* Match system plugin cards (e.g. dsh-ops-cron): primary text on contrast surface */
			".smcp_btnPrimary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);border-color:transparent}",
			".smcp_btnPrimary:disabled{opacity:.5;cursor:default}",
			".smcp_btnGhost{border-color:var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}",
			".smcp_btnGhost:disabled{opacity:.5;cursor:default}",
			".smcp_failDetail{color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.45;text-align:left}",
			".smcp_quickAdd{display:flex;flex-wrap:wrap;gap:8px;padding:2px 0 6px}",
			".smcp_quickBtn{border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:4px 12px;font-size:12px;line-height:1.5;cursor:pointer}",
			".smcp_quickBtn:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}",
			".smcp_quickBtn:disabled{opacity:.5;cursor:default}",
			".smcp_row{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;background:var(--dsw-alias-bg-layer-2)}",
			".smcp_rowHead{display:flex;align-items:center;gap:8px;min-width:0}",
			".smcp_rowToggle{appearance:none;border:0;background:0 0;padding:2px;cursor:pointer;color:var(--dsw-alias-label-tertiary);display:inline-flex;align-items:center;flex:none;transition:transform .16s}",
			".smcp_rowToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px;border-radius:6px}",
			".smcp_rowToggleOpen{transform:rotate(180deg)}",
			".smcp_kindBadge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;flex:none}",
			".smcp_rowTitle{flex:0 0 auto;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:1.5}",
			".smcp_rowSummary{flex:1;min-width:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".smcp_rowBody{border-top:1px dashed var(--dsw-alias-border-l2);margin-top:2px;padding-top:8px;display:flex;flex-direction:column;gap:8px}",
			".smcp_rowId{flex:1;min-width:0}",
			".smcp_rowGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
			".smcp_rowGrid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}",
			".smcp_cell{display:flex;flex-direction:column;gap:4px;min-width:0}",
			".smcp_cellLabel{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.5}",
			".smcp_cellHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:11px;line-height:1.5}",
			".smcp_add{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;border:1px dashed var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 12px;font-size:12px;line-height:1.5;cursor:pointer}",
			".smcp_add:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}",
			".smcp_del{border:1px solid var(--dsw-alias-border-l2);background:0 0;color:var(--dsw-alias-label-secondary);border-radius:8px;padding:4px 10px;font-size:12px;line-height:1.5;cursor:pointer;flex:none}",
			".smcp_del:hover{color:var(--dsw-alias-label-error);border-color:var(--dsw-alias-label-error)}"
		].join("");
		const cssTag = "dsh-search-mcp/card.css";
		if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${cssTag}"]`) === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-search-mcp";
			tag.dataset.pluginCss = cssTag;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion

			//#region provider catalog (browser-side metadata only)
			const CATALOG = {
				bailian: { needsKey: true, apiKeyEnv: "DASHSCOPE_API_KEY" },
				tavily: { needsKey: true },
				brave: { needsKey: true },
				exa: { needsKey: true },
				perplexity: { needsKey: true },
				duckduckgo: { needsKey: false },
				custom: { needsKey: false }
			};
			const KIND_OPTIONS = Object.keys(CATALOG);
			const TRANSPORT_OPTIONS = ["http", "stdio"];
			const AUTH_STYLE_OPTIONS = ["", "query", "header"];

		/** Brand labels shown on the kind badge / quick-add buttons. */
		const KIND_LABELS = {
			bailian: "百炼",
			tavily: "Tavily",
			brave: "Brave",
			exa: "Exa",
			perplexity: "Perplexity",
			duckduckgo: "DuckDuckGo",
			custom: "Custom"
		};
		/** Kinds offered as one-click presets (custom is added via the dashed button). */
		const QUICK_KINDS = ["bailian", "tavily", "brave", "exa", "perplexity", "duckduckgo"];
		//#endregion

		//#region locale
		const en = {
			title: "Search MCP",
			description: "Search MCP servers behind the web_search tool; the built-in DeepSeek search stays disabled while this plugin is enabled.",
			defaultServer: "Default server",
			defaultServerHint: "Which server row serves searches (empty = first row).",
			maxResults: "Max results",
			maxResultsHint: "Sources returned per search (1–50; empty = default).",
			searchTimeoutMs: "Search timeout (s)",
			searchTimeoutMsHint: "Abort a search that takes longer than this.",
			servers: "Search MCP servers",
				serversHint: "Choose a provider and enter its CDKey/API key. Known providers keep connection details in the host catalog; custom rows expose advanced MCP settings.",
				quickAdd: "Common providers",
				quickAddHint: "Add a provider row, then enter its CDKey/API key before saving. No endpoint is required for known providers.",
			addServer: "Add custom server",
			removeServer: "Delete",
			rowId: "ID",
			rowIdHint: "Stable id used by “default server”.",
			rowKind: "Provider",
			rowTransport: "Transport",
			rowUrl: "Endpoint (URL)",
			rowCommand: "Command",
			rowArgs: "Args (comma separated)",
				rowApiKey: "API key",
				cdKey: "CDKey / API key",
				cdKeyHint: "enter CDKey / API key",
				keyNotRequired: "no key required",

			rowApiKeyEnv: "Key env/credential ref",
			rowAuthStyle: "Key placement",
			rowAuthParam: "Key param / env name",
			rowToolName: "MCP tool name",
			rowMaxResults: "Max results",
			rowMaxResultsHint: "Empty = follow the global max results.",
			missingId: "ID is required.",
			dupId: "This ID is already used by another row.",
			overridden: "Overridden",
			overridesGlobal: "overrides global",
				keySet: "key set",
				keyRef: "credential ref",
				keyConfigured: "credential configured",
				keyRefMissing: "credential missing",
				keyMissing: "key missing",
				legacyKey: "legacy key",
				legacyKeyBlocked: "This server still uses a hidden legacy literal key. Enter a replacement key or credential reference before changing the server list.",

			customKind: "Custom",
			reset: "Reset to default",
			readOnly: "This deployment stores settings read-only.",
			save: "Save",
			saving: "Saving…",
			discard: "Discard",
			unsaved: "Unsaved",
			saveFailed: "The deployment did not accept these values; they were left for you to correct.",
				placeholderUrl: "https://mcp.example.com/mcp/",
				placeholderCommand: "npx",
			placeholderArgs: "-y, duckduckgo-mcp-server",
			placeholderToolName: "tavily_search",
			placeholderAuthParam: "tavilyApiKey"
		};
		const zh = {
			title: "搜索 MCP",
			description: "web_search 工具背后的搜索 MCP 服务器；插件启用期间内置 DeepSeek 搜索保持禁用。",
			defaultServer: "默认服务器",
			defaultServerHint: "使用哪一行服务器（留空 = 第一行）。",
			maxResults: "结果数上限",
			maxResultsHint: "每次搜索最多返回的条数（1–50；留空 = 默认）。",
			searchTimeoutMs: "搜索超时（秒）",
			searchTimeoutMsHint: "超过该时长即中止搜索。",
			servers: "搜索 MCP 服务器",
				serversHint: "选择提供商并填写 CDKey/API key。已知提供商的连接细节由 Host catalog 管理；自定义行才显示 MCP 高级设置。",
				quickAdd: "常用提供商",
				quickAddHint: "添加提供商行后填写 CDKey/API key 再保存。已知提供商不需要填写端点链接。",
			addServer: "添加自定义服务器",
			removeServer: "删除",
			rowId: "ID",
			rowIdHint: "“默认服务器”下拉框引用的稳定标识。",
			rowKind: "提供商",
			rowTransport: "传输方式",
			rowUrl: "端点（URL）",
			rowCommand: "命令",
			rowArgs: "参数（逗号分隔）",
				rowApiKey: "API 密钥",
				cdKey: "CDKey / API key",
				cdKeyHint: "请填写 CDKey / API key",
				keyNotRequired: "无需密钥",

			rowApiKeyEnv: "密钥环境变量/凭证引用",
			rowAuthStyle: "密钥位置",
			rowAuthParam: "密钥参数名/环境变量名",
			rowToolName: "MCP 工具名",
			rowMaxResults: "结果数上限",
			rowMaxResultsHint: "留空 = 跟随全局结果数上限。",
			missingId: "ID 不能为空。",
			dupId: "该 ID 已被另一行占用。",
			overridden: "已覆盖",
			overridesGlobal: "覆盖全局",
				keySet: "已填密钥",
				keyRef: "凭证引用",
				keyConfigured: "凭证已配置",
				keyRefMissing: "凭证未配置",
				keyMissing: "缺少密钥",
				legacyKey: "旧版密钥",
				legacyKeyBlocked: "此服务器仍使用客户端不可见的旧版字面密钥。修改服务器列表前，请输入替代密钥或凭证引用。",

			customKind: "自定义",
			reset: "恢复默认",
			readOnly: "本部署的设置为只读。",
			save: "保存",
			saving: "保存中…",
			discard: "放弃修改",
			unsaved: "未保存",
			saveFailed: "本部署没有接受这些值，已保留供你修改。",
				placeholderUrl: "https://mcp.example.com/mcp/",
				placeholderCommand: "npx",
			placeholderArgs: "-y, duckduckgo-mcp-server",
			placeholderToolName: "tavily_search",
			placeholderAuthParam: "tavilyApiKey"
		};
		//#endregion

		const NS = "search-mcp";
		const LOCALE_NS = "settings.search-mcp";

		//#region row helpers
			function emptyRow() {
			return {
				id: "",
				kind: "custom",
				transport: "http",
				url: "",
				command: "",
				args: "",
				apiKey: "",
				apiKeyEnv: "",
				authStyle: "",
				authParam: "",
				authPrefix: "",
				toolName: "",
				maxResults: ""
			};
		}
			/** Convert a stored server entry (host shape) to a row draft. */
			function rowFromEntry(entry) {
				let kind = Object.hasOwn(CATALOG, entry.kind) ? entry.kind : "custom";
				// Legacy patch/settings stored Bailian as kind:custom + dashscope URL.
				if (kind === "custom") {
					const url = String(entry.url || "").toLowerCase();
					if (entry.toolName === "bailian_web_search" || url.includes("dashscope.aliyuncs.com")) {
						kind = "bailian";
					}
				}
				const known = kind !== "custom";
				const presetEnv = CATALOG[kind]?.apiKeyEnv || "";
				return {
					id: entry.id ?? "",
					kind,
					transport: known ? "" : (entry.transport ?? "http"),
					url: known ? "" : (entry.url ?? ""),
					command: known ? "" : (entry.command ?? ""),
					args: known ? "" : (Array.isArray(entry.args) ? entry.args.join(", ") : ""),
					apiKey: entry.apiKey ?? "",
					apiKeyEnv: entry.apiKeyEnv || (known ? presetEnv : "") || "",
					authStyle: known ? "" : (entry.authStyle ?? ""),
					authParam: known ? "" : (entry.authParam ?? ""),
					authPrefix: known ? "" : (entry.authPrefix ?? ""),
					toolName: known ? "" : (entry.toolName ?? ""),
					maxResults: entry.maxResults === undefined ? "" : String(entry.maxResults)
				};
			}
			/** Convert a row draft to the minimal known entry or full custom entry. */
			function entryFromRow(row) {
				const entry = { id: row.id.trim(), kind: row.kind };
				const known = Object.hasOwn(CATALOG, row.kind) && row.kind !== "custom";
				if (!known) {
					entry.transport = row.transport || "http";
					if (entry.transport === "stdio") {
						if (row.command.trim() !== "") entry.command = row.command.trim();
						const args = row.args.split(",").map((a) => a.trim()).filter(Boolean);
						if (args.length > 0) entry.args = args;
					} else {
						const url = normalizeServerUrl(row);
						if (url !== "") entry.url = url;
					}
					if (row.authStyle !== "") entry.authStyle = row.authStyle;
					if (row.authParam.trim() !== "") entry.authParam = row.authParam.trim();
					const prefix = resolveAuthPrefix(row);
					if (prefix !== "") entry.authPrefix = prefix;
					if (row.toolName.trim() !== "") entry.toolName = row.toolName.trim();
				}
				if (row.apiKey.trim() !== "") entry.apiKey = row.apiKey.trim();
				if (row.apiKeyEnv.trim() !== "") entry.apiKeyEnv = row.apiKeyEnv.trim();
				if (row.maxResults.trim() !== "") {
					const n = Number(row.maxResults);
					if (Number.isFinite(n) && n > 0) entry.maxResults = Math.round(n);
				}
				return entry;
			}
			/** Changing provider starts a clean credential/connection draft. */
			function applyKindDefaults(row, kind) {
				const presetEnv = CATALOG[kind]?.apiKeyEnv || "";
				const next = { ...row, kind, apiKey: "", apiKeyEnv: presetEnv };
				if (kind !== "custom") {
					return { ...next, transport: "", url: "", command: "", args: "", authStyle: "", authParam: "", toolName: "" };
				}
				return { ...next, transport: row.transport || "http" };
			}

		/** Suggest a unique row id for a preset kind (tavily, tavily2, …). */
		function suggestId(servers, kind) {
			const used = new Set(servers.map((row) => row.id.trim()).filter(Boolean));
			let id = kind;
			let n = 2;
			while (used.has(id)) id = `${kind}${n++}`;
			return id;
		}
		/** Brand label for a kind, localized for `custom`. */
			function kindLabel(kind, t) {
				if (kind === "custom") return t("customKind");
				return KIND_LABELS[kind] ?? kind;
			}
			function deepEqualJson(left, right) {
				return JSON.stringify(left) === JSON.stringify(right);
			}
			/** Snapshot-safe copy — `createSnapshotStore.set` deep-freezes state in
			 *  non-production, so the live editable draft must never be published by reference. */
			function cloneDraft(draft) {
				return {
					defaultServer: draft.defaultServer,
					maxResults: draft.maxResults,
					searchTimeoutMs: draft.searchTimeoutMs,
					servers: draft.servers.map((row) => ({ ...row })),
				};
			}
			function credentialRefFor(row) {
				if (row.apiKeyEnv.trim() !== "") return row.apiKeyEnv.trim();
				if (row.kind === "bailian" || (row.url || "").toLowerCase().includes("dashscope.aliyuncs.com")) {
					return "DASHSCOPE_API_KEY";
				}
				const preset = CATALOG[row.kind]?.apiKeyEnv;
				if (preset) return preset;
				const id = row.id.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
				return `SEARCH_MCP_${id || "SERVER"}_API_KEY`;
			}
			/** Normalize Bailian WebSearch endpoint if the user truncated it. */
			function normalizeServerUrl(row) {
				let url = (row.url || "").trim();
				if (!url) return url;
				if (row.toolName === "bailian_web_search" || url.includes("dashscope.aliyuncs.com")) {
					if (url === "https://dashscope.aliyuncs.com/api/v1"
						|| url === "https://dashscope.aliyuncs.com/api/v1/"
						|| /\/api\/v1\/?$/.test(url) && url.includes("dashscope")) {
						url = "https://dashscope.aliyuncs.com/api/v1/mcps/WebSearch/mcp";
					}
					if (url.endsWith("/WebSearch/sse")) {
						url = url.replace(/\/WebSearch\/sse$/, "/WebSearch/mcp");
					}
				}
				return url;
			}
			function resolveAuthPrefix(row) {
				const explicit = (row.authPrefix || "").trim();
				if (explicit !== "") return explicit.endsWith(" ") ? explicit : `${explicit} `;
				if (row.authStyle === "header" && row.authParam.trim() === "Authorization") return "Bearer ";
				return "";
			}
			const CREDENTIAL_DESCRIBE_BATCH_SIZE = 64;
			/** 0.1.2+ Remote face: `remote.credentials.describe(refs)` → `{ ok, value }`. */
			async function describeCredentialRefs(remote, refs) {
				const states = {};
				for (let index = 0; index < refs.length; index += CREDENTIAL_DESCRIBE_BATCH_SIZE) {
					const batch = refs.slice(index, index + CREDENTIAL_DESCRIBE_BATCH_SIZE);
					const response = await remote.credentials.describe(batch);
					if (!response.ok) throw new Error(response.error?.message || "credential state lookup failed");
					Object.assign(states, response.value ?? {});
				}
				return states;
			}
			async function rollbackNewCredentialRefs(remote, refs) {
				for (const ref of [...new Set(refs)].reverse()) {
					try {
						await remote.credentials.unset(ref);
					} catch {
						// The save already failed; preserve the original error state.
					}
				}
			}
			async function rollbackSettingsWrites(scope, writes) {
				for (const [field, previous] of writes.reverse()) {
					try {
						if (previous === undefined) await scope.unset(field);
						else await scope.set(field, previous);
					} catch {
						// The UI remains failed so the user can retry or discard the draft.
					}
				}
			}
			//#endregion


		//#region controller (whole-section staged draft)
			var SearchMcpCardController = class {
				constructor(scope, remoteOrGetter, describeFace) {
					this.scope = scope;
					// Lazy remote: Desktop may not have ctx.remote at first paint.
					// Capturing a stub forever made Save fail with "credential state lookup failed".
					this.getRemote = typeof remoteOrGetter === "function"
						? remoteOrGetter
						: () => remoteOrGetter;
					this.describeFace = describeFace;
					this.draft = null;
					this.listeners = new Set();
					this.saving = false;
					this.failed = false;
					this.failDetail = "";
					this.legacyBlocked = false;
					this.secretStateReady = false;
					this.legacySecretIds = new Set();
					this.credentialStates = {};
					/** Refs we successfully wrote — survives describe failures / redaction / remount. */
					this.knownConfiguredRefs = new Set();
					try {
						const raw = sessionStorage.getItem("dsh-search-mcp:configured-refs");
						const list = raw ? JSON.parse(raw) : [];
						if (Array.isArray(list)) for (const ref of list) if (typeof ref === "string" && ref) this.knownConfiguredRefs.add(ref);
					} catch { /* private mode */ }
					try {
						this.store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(this.project());
					} catch {
						this.store = createSnapshotStoreFallback(this.project());
					}
					if (!this.store || typeof this.store.set !== "function") {
						this.store = createSnapshotStoreFallback(this.project());
					}
					scope.subscribe(() => {
						if (this.draft === null) this.publish();
						void this.readSecretState();
					});
					void this.readSecretState().catch(() => {});
				}
				markConfigured(refs) {
					for (const ref of refs) {
						if (typeof ref !== "string" || !ref.trim()) continue;
						const id = ref.trim();
						this.knownConfiguredRefs.add(id);
						this.credentialStates = {
							...this.credentialStates,
							[id]: {
								...(this.credentialStates[id] || {}),
								configured: true,
								writable: true,
							},
						};
					}
					try {
						sessionStorage.setItem(
							"dsh-search-mcp:configured-refs",
							JSON.stringify([...this.knownConfiguredRefs]),
						);
					} catch { /* private mode */ }
				}
				section() {
					return this.scope.getSnapshot();
				}
				value() {
					return this.section().value ?? {};
				}
				userLayer() {
					return this.section().user;
				}
				baseDraft() {
					const value = this.value();
					return {
						defaultServer: typeof value.defaultServer === "string" ? value.defaultServer : "",
						maxResults: typeof value.maxResults === "number" ? String(value.maxResults) : "",
						searchTimeoutMs: typeof value.searchTimeoutMs === "number" ? String(value.searchTimeoutMs) : "",
						servers: Array.isArray(value.servers) ? value.servers.map((entry) => ({
							...rowFromEntry(entry),
							legacySecret: this.legacySecretIds.has(entry.id)
						})) : []
					};
				}
				applyKnownConfigured(states) {
					const merged = { ...(states || {}) };
					for (const ref of this.knownConfiguredRefs) {
						if (!merged[ref]?.configured) {
							merged[ref] = { ...(merged[ref] || {}), configured: true, writable: merged[ref]?.writable ?? true };
						}
					}
					return merged;
				}
				async readSecretState() {
					const remote = this.getRemote();
					let view;
					try {
						const response = await remote.settings.describe();
						if (response.ok) {
							view = (response.value?.namespaces ?? []).find((candidate) => candidate.ns === NS);
						}
					} catch { /* settings describe optional */ }
					const scopeServers = Array.isArray(this.value().servers) ? this.value().servers : [];
					const viewServers = Array.isArray(view?.value?.servers) ? view.value.servers : [];
					const servers = viewServers.length > 0 ? viewServers : scopeServers;
					const ids = new Set();
					for (const secret of view?.secrets ?? []) {
						if (!secret.set || secret.path?.[0] !== "servers" || secret.path?.[2] !== "apiKey") continue;
						const index = Number(secret.path[1]);
						const id = Number.isInteger(index) ? servers[index]?.id : undefined;
						if (typeof id === "string" && id.length > 0) ids.add(id);
					}
					const wasReady = this.secretStateReady;
					const changed = !deepEqualJson([...ids].sort(), [...this.legacySecretIds].sort());
					this.legacySecretIds = ids;
					const previousCredentialStates = this.credentialStates;
					const refs = [...new Set([
						...servers.map((entry) => typeof entry.apiKeyEnv === "string" ? entry.apiKeyEnv.trim() : ""),
						...scopeServers.map((entry) => typeof entry.apiKeyEnv === "string" ? entry.apiKeyEnv.trim() : ""),
						...this.knownConfiguredRefs,
					].filter(Boolean))];
					if (refs.length > 0 && remote.__stub !== true) {
						try {
							const described = await describeCredentialRefs(remote, refs);
							this.credentialStates = this.applyKnownConfigured(described);
						} catch {
							this.credentialStates = this.applyKnownConfigured(this.credentialStates);
						}
					} else {
						// Never wipe optimistic Save marks when describe is empty/unavailable.
						this.credentialStates = this.applyKnownConfigured(this.credentialStates);
					}

					this.secretStateReady = true;
					const credentialsChanged = !deepEqualJson(previousCredentialStates, this.credentialStates);
					if (this.draft === null && (changed || credentialsChanged || !wasReady)) this.publish();
				}


			ensureDraft() {
				if (this.draft === null) this.draft = this.baseDraft();
				return this.draft;
			}
			project() {
				const snapshot = this.section();
				const draft = this.draft;
				const sectionValue = snapshot.value ?? {};
				const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(this.baseDraft());
				const ids = draft !== null ? draft.servers.map((row) => row.id.trim()) : [];
				const invalid = draft !== null && (ids.some((id) => id === "") || new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length);
				const serverKinds = draft !== null
					? Object.fromEntries(draft.servers.map((row) => [row.id.trim(), row.kind]))
					: Object.fromEntries((Array.isArray(sectionValue.servers) ? sectionValue.servers : []).map((s) => [s.id, s.kind]));
					return {
						available: snapshot.status === "ready",
						// Do not gate edits on secretStateReady — a failed describe must not freeze the form.
						writable: snapshot.writable === true,

					dirty,
						invalid,
						saving: this.saving,
						failed: this.failed,
						failDetail: this.failDetail,
						legacyBlocked: this.legacyBlocked,

					overridden: this.userLayer() !== null && typeof this.userLayer() === "object" && !Array.isArray(this.userLayer())
						? Object.keys(this.userLayer()).length > 0
						: false,
					value: draft !== null ? cloneDraft(draft) : this.baseDraft(),
					serverIds: draft !== null
						? ids.filter(Boolean)
						: (Array.isArray(sectionValue.servers) ? sectionValue.servers.map((s) => s.id).filter(Boolean) : []),
						serverKinds,
						credentialStates: this.applyKnownConfigured(this.credentialStates),
						configuredRefs: [...this.knownConfiguredRefs],

				};
			}
			publish() {
				if (!this.store || typeof this.store.set !== "function") return;
				this.store.set(this.project());
			}
			actions() {
				return {
						editScalar: (field, text) => {
							this.ensureDraft()[field] = text;
							this.failed = false;
							this.legacyBlocked = false;
							this.publish();

					},
						editRow: (index, field, value) => {
							const draft = this.ensureDraft();
							draft.servers[index] = { ...draft.servers[index], [field]: value };
							this.failed = false;
							this.legacyBlocked = false;
							this.publish();

					},
						changeKind: (index, kind) => {
							const draft = this.ensureDraft();
							draft.servers[index] = applyKindDefaults(draft.servers[index], kind);
							this.failed = false;
							this.legacyBlocked = false;

						this.publish();
					},
						addServer: () => {
							const draft = this.ensureDraft();
							draft.servers.push(emptyRow());
							this.failed = false;
							this.legacyBlocked = false;

						this.publish();
					},
						quickAdd: (kind) => {
							const draft = this.ensureDraft();
							const id = suggestId(draft.servers, kind);
							const row = applyKindDefaults({ ...emptyRow(), id, kind }, kind);
							draft.servers.push(row);
							this.failed = false;
							this.legacyBlocked = false;

						this.publish();
					},
						removeServer: (index) => {
							const draft = this.ensureDraft();
							draft.servers.splice(index, 1);
							this.failed = false;
							this.legacyBlocked = false;

						this.publish();
					},
						discard: () => {
							if (this.draft === null && !this.failed && !this.legacyBlocked) return;
							this.draft = null;
							this.failed = false;
							this.failDetail = "";
							this.legacyBlocked = false;
							this.publish();

					},
					save: () => {
						this.save();
					}
				};
			}
					async save() {
						if (this.draft === null || this.saving) return;

					const draft = this.draft;
					const ids = draft.servers.map((row) => row.id.trim());
					const invalid = ids.some((id) => id === "") || new Set(ids.filter(Boolean)).size !== ids.filter(Boolean).length;
					if (invalid) return;
					const base = this.baseDraft();
					const serversChanged = !deepEqualJson(draft.servers, base.servers);
					if (serversChanged) {
						const blocked = draft.servers.some((row) => row.legacySecret && row.apiKey.trim() === "" && row.apiKeyEnv.trim() === "");
						if (blocked) {
							this.legacyBlocked = true;
							this.publish();
							return;
						}
					}
					this.saving = true;
					this.failed = false;
					this.failDetail = "";
					this.legacyBlocked = false;
					this.publish();

						let remote = this.getRemote();
						let landed = true;
						let failDetail = "";
						let serverEntries;
						const createdCredentialRefs = [];
						let savedCredentialRefs = [];
						if (serversChanged && landed) {
							serverEntries = [];
							const credentialWrites = draft.servers
								.filter((row) => row.apiKey.trim() !== "")
								.map((row) => ({ ref: credentialRefFor(row), value: row.apiKey.trim() }));
							savedCredentialRefs = credentialWrites.map(({ ref }) => ref);
							// Soft-inject may land a tick after Settings opens — wait briefly.
							if (credentialWrites.length > 0 && remote.__stub === true) {
								for (let i = 0; i < 25 && this.getRemote().__stub === true; i += 1) {
									await new Promise((r) => setTimeout(r, 100));
								}
								remote = this.getRemote();
							}
							// Last resort: persist apiKey on the server row (Config role:secret).
							// Host resolveOptions reads apiKey before credentials/env.
							const inlineSecrets = credentialWrites.length > 0 && remote.__stub === true;
							let credentialBefore = {};
							try {
								if (landed && credentialWrites.length > 0 && !inlineSecrets) {
									credentialBefore = await describeCredentialRefs(remote, [...new Set(credentialWrites.map(({ ref }) => ref))]);
								}
							} catch (error) {
								landed = false;
								failDetail = error instanceof Error ? error.message : String(error);
							}
							if (landed && !inlineSecrets && credentialWrites.some(({ ref }) => credentialBefore[ref]?.writable === false)) {
								landed = false;
								failDetail = "credential is not writable";
							}
							if (landed && !inlineSecrets) {
								for (const { ref, value } of credentialWrites) {
									if (!credentialBefore[ref]?.configured) createdCredentialRefs.push(ref);
									try {
										const response = await remote.credentials.set(ref, value);
										if (!response.ok) {
											landed = false;
											failDetail = response.error?.message || "credentials.set failed";
											break;
										}
									} catch (error) {
										landed = false;
										failDetail = error instanceof Error ? error.message : String(error);
										break;
									}
								}
							}
							if (!landed) {
								await rollbackNewCredentialRefs(remote, createdCredentialRefs);
								this.saving = false;
								this.failed = true;
								this.failDetail = failDetail;
								this.publish();
								return;
							}
							for (const row of draft.servers) {
								const entry = entryFromRow(row);
								if (row.apiKey.trim() !== "") {
									if (inlineSecrets) {
										entry.apiKey = row.apiKey.trim();
										entry.apiKeyEnv = credentialRefFor(row);
									} else {
										delete entry.apiKey;
										entry.apiKeyEnv = credentialRefFor(row);
									}
								} else if (!entry.apiKeyEnv && (row.url || "").includes("dashscope")) {
									entry.apiKeyEnv = "DASHSCOPE_API_KEY";
								}
								delete entry.legacySecret;
								serverEntries.push(entry);
							}
						}

						const ops = [];
						const planned = [
							["defaultServer", draft.defaultServer.trim(), base.defaultServer],
							["maxResults", draft.maxResults.trim() === "" ? undefined : Number(draft.maxResults), base.maxResults === "" ? undefined : Number(base.maxResults)],
							["searchTimeoutMs", draft.searchTimeoutMs.trim() === "" ? undefined : Number(draft.searchTimeoutMs), base.searchTimeoutMs === "" ? undefined : Number(base.searchTimeoutMs)],
							...(serversChanged ? [["servers", serverEntries, this.value().servers]] : [])
						];
						for (const [field, value, previous] of planned) {
							if (deepEqualJson(value, previous)) continue;
							if (value === undefined) ops.push({ op: "unset", path: [field] });
							else ops.push({ op: "set", path: [field], value });
						}

						// Prefer writing through the attached form scope when available
						// (configForms). Memory fallback must NOT accept Save — it is not durable.
						if (ops.length > 0 && landed) {
							const scope = this.scope;
							let wroteViaScope = false;
							if (
								typeof scope.set === "function"
								&& typeof scope.unset === "function"
								&& scope.__memory !== true
							) {
								try {
									for (const op of ops) {
										if (op.op === "unset") await scope.unset(op.path[0]);
										else await scope.set(op.path[0], op.value);
									}
									wroteViaScope = true;
								} catch (error) {
									failDetail = error instanceof Error ? error.message : String(error);
								}
							}
							if (!wroteViaScope) {
								try {
									const revision = this.section().revision;
									const response = await remote.settings.mutate(NS, ops, revision);
									if (!response.ok) {
										landed = false;
										failDetail = response.error?.message || response.error?.code || "settings.mutate failed";
										try {
											if (typeof this.describeFace?.load === "function") await this.describeFace.load();
											else if (typeof this.describeFace?.ensure === "function") await this.describeFace.ensure();
										} catch { /* keep draft */ }
									} else if (response.value && typeof this.describeFace?.acceptView === "function") {
										this.describeFace.acceptView(response.value);
									}
								} catch (error) {
									landed = false;
									failDetail = error instanceof Error ? error.message : String(error);
								}
							} else if (failDetail) {
								landed = false;
							}
						}

						if (!landed) {
							await rollbackNewCredentialRefs(remote, createdCredentialRefs);
						} else {
							// Badge reads credentialStates — keep configured after Save even when
							// Host describe is slow/unavailable or secrets are redacted from the form.
							if (savedCredentialRefs.length > 0) this.markConfigured(savedCredentialRefs);
							this.draft = null;
						}
						this.saving = false;
						this.failed = !landed;
						this.failDetail = landed ? "" : failDetail;
						this.publish();
						if (landed) void this.readSecretState();
				}

			inject() {
				return {
					hooks: { searchMcpCard: this.store },
					...this.actions()
				};
			}
		};
		//#endregion

		//#region components
		const EMPTY_CARD_STATE = {
			available: true,
			writable: false,
			dirty: false,
			invalid: false,
			saving: false,
			failed: false,
			failDetail: "",
			legacyBlocked: false,
			overridden: false,
			value: { defaultServer: "", maxResults: "", searchTimeoutMs: "", servers: [] },
			serverIds: [],
			serverKinds: {},
			credentialStates: {},
			configuredRefs: [],
		};
		function SearchMcpSection(props) {
			return SearchMcpView(props, true);
		}
		function SearchMcpCard(props) {
			return SearchMcpView(props, false);
		}
		function SearchMcpView(props, asSection) {
			const t = typeof props.t === "function" ? props.t : (key) => key;
			const [open, setOpen] = (0, react.useState)(!!asSection);
			// Missing inject hooks used to throw; empty panel looked like a nav bug.
			const useCard = typeof props.useSearchMcpCard === "function"
				? props.useSearchMcpCard
				: (select) => select(EMPTY_CARD_STATE);
			let state;
			try {
				state = useCard((snapshot) => snapshot) || EMPTY_CARD_STATE;
			} catch {
				state = EMPTY_CARD_STATE;
			}
			if (!state.available) {
				return jsx("div", {
					className: "smcp_section",
					children: jsx("p", { className: "smcp_hint", children: t("readOnly") || "表单暂时不可用" }),
				});
			}
			const disabled = !state.writable;
			const rawValue = state.value && typeof state.value === "object"
				? state.value
				: EMPTY_CARD_STATE.value;
			const value = {
				defaultServer: typeof rawValue.defaultServer === "string" ? rawValue.defaultServer : "",
				maxResults: rawValue.maxResults ?? "",
				searchTimeoutMs: rawValue.searchTimeoutMs ?? "",
				servers: Array.isArray(rawValue.servers) ? rawValue.servers : [],
			};
			const title = t("title");
			const serverOptions = [
				{ value: "", label: "—" },
				...state.serverIds.map((id) => ({ value: id, label: `${id} · ${kindLabel(state.serverKinds[id], t)}` }))
			];
			const rowIds = value.servers.map((row) => row.id.trim()).filter(Boolean);
			const dupIds = new Set(rowIds.filter((id, index) => rowIds.indexOf(id) !== index));
			const showBody = asSection || open;
			const formBody = showBody ? (0, react_jsx_runtime.jsxs)("div", {
				className: asSection ? "smcp_body smcp_bodyFlat" : "smcp_body",
				children: [
							!state.writable ? (0, react_jsx_runtime.jsx)("p", { className: "smcp_hint", children: t("readOnly") }) : null,
							(0, react_jsx_runtime.jsx)(SelectField, {
								id: "smcp-default-server",
								label: t("defaultServer"),
								hint: t("defaultServerHint"),
								disabled,
								options: serverOptions,
								value: value.defaultServer,
								onEdit: (text) => props.editScalar("defaultServer", text)
							}),
							(0, react_jsx_runtime.jsx)(TextField, {
								id: "smcp-max-results",
								label: t("maxResults"),
								hint: t("maxResultsHint"),
								numeric: true,
								disabled,
								value: value.maxResults,
								onEdit: (text) => props.editScalar("maxResults", text)
							}),
							(0, react_jsx_runtime.jsx)(TextField, {
								id: "smcp-timeout",
								label: t("searchTimeoutMs"),
								hint: t("searchTimeoutMsHint"),
								numeric: true,
								disabled,
								value: value.searchTimeoutMs === "" ? "" : String(Math.round(Number(value.searchTimeoutMs) / 1000)),
								onEdit: (text) => props.editScalar("searchTimeoutMs", text === "" ? "" : String(Math.round((Number(text) || 0) * 1000)))
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: "smcp_field",
								children: [
									(0, react_jsx_runtime.jsx)("span", { className: "smcp_label", children: t("servers") }),
									(0, react_jsx_runtime.jsx)("p", { className: "smcp_hint", children: t("serversHint") }),
									(0, react_jsx_runtime.jsx)("p", { className: "smcp_hint", children: t("quickAddHint") }),
									(0, react_jsx_runtime.jsxs)("div", {
										className: "smcp_quickAdd",
										children: QUICK_KINDS.map((kind) => (0, react_jsx_runtime.jsx)(
											"button",
											{
												type: "button",
												className: "smcp_quickBtn",
												disabled,
												onClick: () => props.quickAdd(kind),
												children: `+ ${KIND_LABELS[kind]}`
											},
											`smcp-quick-${kind}`
										))
									}),
									value.servers.map((row, index) => (0, react_jsx_runtime.jsx)(
										ServerRow,
										{
											t,
											row,
											index,
											disabled,
												dupIds,
												credentialStates: state.credentialStates,
												configuredRefs: state.configuredRefs,

											onEdit: (field, val) => props.editRow(index, field, val),
											onKind: (kind) => props.changeKind(index, kind),
											onRemove: () => props.removeServer(index)
										},
										`smcp-row-${index}`
									)),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "smcp_add",
										disabled,
										onClick: props.addServer,
										children: `+ ${t("addServer")}`
									})
								]
							}),
								state.legacyBlocked ? (0, react_jsx_runtime.jsx)("p", { role: "status", className: "smcp_error", children: t("legacyKeyBlocked") }) : null,

							(0, react_jsx_runtime.jsxs)("div", {
								className: "smcp_footer",
								children: [
									state.failed ? (0, react_jsx_runtime.jsx)("p", { role: "status", className: "smcp_failDetail", children: state.failDetail ? (t("saveFailed") + " — " + state.failDetail) : t("saveFailed") }) : null,
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "smcp_btn smcp_btnGhost",
										disabled: !state.dirty || state.saving,
										onClick: props.discard,
										children: t("discard")
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "smcp_btn smcp_btnPrimary",
										disabled: !state.dirty || state.invalid || state.saving,
										onClick: props.save,
										children: t(state.saving ? "saving" : "save")
									})
								]
							})
						]
			}) : null;
			if (asSection) {
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "smcp_section",
					children: [
						(0, react_jsx_runtime.jsx)("p", { className: "smcp_lede", children: t("description") }),
						state.overridden ? (0, react_jsx_runtime.jsx)("span", { className: "smcp_badge", children: t("overridden") }) : null,
						state.dirty ? (0, react_jsx_runtime.jsx)("span", { className: "smcp_badgeMuted", children: t("unsaved") }) : null,
						formBody
					]
				});
			}
			return (0, react_jsx_runtime.jsxs)("li", {
				className: "smcp_card" + (open ? " smcp_cardOpen" : ""),
				children: [
					(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "smcp_headBtn",
						"aria-expanded": open,
						"aria-label": `${open ? "收起" : "展开"}: ${title}`,
						onClick: () => { setOpen(!open); },
						children: [
							(0, react_jsx_runtime.jsxs)("span", {
								className: "smcp_head",
								children: [
									(0, react_jsx_runtime.jsx)("span", { className: "smcp_name", children: title }),
									(0, react_jsx_runtime.jsx)("span", { className: "smcp_desc", children: t("description") }),
									state.overridden ? (0, react_jsx_runtime.jsx)("span", { className: "smcp_badge", children: t("overridden") }) : null,
									state.dirty ? (0, react_jsx_runtime.jsx)("span", { className: "smcp_badgeMuted", children: t("unsaved") }) : null
								]
							}),
							jsx(IconChevronDownOutline14, {
								className: "smcp_chevron" + (open ? " smcp_chevronOpen" : "")
							})
						]
					}),
					formBody
				]
			});
		}
			function ServerRow(props) {
				const { t, row, index, disabled, onEdit, onKind, onRemove } = props;
				const [rowOpen, setRowOpen] = (0, react.useState)(false);
				const rowInvalid = row.id.trim() === "";
				const dup = !rowInvalid && row.id.trim() !== "" && props.dupIds && props.dupIds.has(row.id.trim());
				const known = row.kind !== "custom";
				const needsKey = (CATALOG[row.kind] ?? CATALOG.custom).needsKey;
				const hasKey = row.apiKey.trim() !== "";
				const hasKeyEnv = row.apiKeyEnv.trim() !== "";
				const ref = row.apiKeyEnv.trim();
				const configuredList = Array.isArray(props.configuredRefs) ? props.configuredRefs : [];
				const hasConfiguredRef = hasKeyEnv && (
					props.credentialStates?.[ref]?.configured === true
					|| configuredList.includes(ref)
				);
				const hasLegacyKey = row.legacySecret === true;
				const overridesGlobal = row.maxResults.trim() !== "";
				const summary = known ? (needsKey ? (hasKeyEnv ? `${t("keyRef")}: ${ref}` : t("cdKeyHint")) : t("keyNotRequired")) : (row.transport === "stdio"
					? ((row.command.trim() !== "" ? row.command.trim() : "") + (row.args.trim() !== "" ? " " + row.args.trim() : "")).trim() || row.id
					: (row.url.trim() !== "" ? row.url.trim() : row.id));
				const badges = [];
				if (hasKey) badges.push((0, react_jsx_runtime.jsx)("span", { className: "smcp_badge", children: t("keySet") }, "badge-key"));
				else if (hasConfiguredRef) badges.push((0, react_jsx_runtime.jsx)("span", { className: "smcp_badge", children: `${t("keyConfigured")}: ${ref}` }, "badge-env"));
				else if (hasKeyEnv) badges.push((0, react_jsx_runtime.jsx)("span", { className: "smcp_badgeDanger", children: `${t("keyRefMissing")}: ${ref}` }, "badge-env-missing"));
				else if (hasLegacyKey) badges.push((0, react_jsx_runtime.jsx)("span", { className: "smcp_badgeMuted", children: t("legacyKey") }, "badge-legacy-key"));
				else if (needsKey) badges.push((0, react_jsx_runtime.jsx)("span", { className: "smcp_badgeDanger", children: t("keyMissing") }, "badge-key-missing"));
				if (overridesGlobal) badges.push((0, react_jsx_runtime.jsx)("span", { className: "smcp_badgeMuted", children: t("overridesGlobal") }, "badge-override"));
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "smcp_row",
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: "smcp_rowHead",
							children: [
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "smcp_rowToggle" + (rowOpen ? " smcp_rowToggleOpen" : ""),
									"aria-expanded": rowOpen,
									"aria-label": `${rowOpen ? "收起" : "展开"} ${row.id || t("rowId")}`,
									disabled,
									onClick: () => setRowOpen(!rowOpen),
									children: jsx(IconChevronDownOutline14, {})
								}),
								(0, react_jsx_runtime.jsx)("span", { className: "smcp_kindBadge", children: kindLabel(row.kind, t) }),
								(0, react_jsx_runtime.jsx)("span", { className: "smcp_rowTitle" + (rowInvalid ? " smcp_invalid" : ""), children: row.id.trim() !== "" ? row.id.trim() : t("rowId") }),
								(0, react_jsx_runtime.jsx)("span", { className: "smcp_rowSummary", children: summary }),
								...badges,
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "smcp_del", disabled, onClick: onRemove, children: t("removeServer") })
							]
						}),
						rowInvalid ? (0, react_jsx_runtime.jsx)("p", { className: "smcp_error", children: t("missingId") }) : null,
						dup ? (0, react_jsx_runtime.jsx)("p", { className: "smcp_error", children: t("dupId") }) : null,
						rowOpen ? (0, react_jsx_runtime.jsxs)("div", {
							className: "smcp_rowBody",
							children: known ? [
								(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowId"), placeholder: t("rowIdHint"), value: row.id, disabled, onEdit: (v) => onEdit("id", v) }),
								(0, react_jsx_runtime.jsxs)("div", { className: "smcp_rowGrid3", children: [
									(0, react_jsx_runtime.jsx)(CellSelect, { label: t("rowKind"), options: KIND_OPTIONS, value: row.kind, disabled, onEdit: onKind }),
									needsKey ? (0, react_jsx_runtime.jsx)(CellInput, { label: t("cdKey"), type: "password", placeholder: t("cdKeyHint"), value: row.apiKey, disabled, onEdit: (v) => onEdit("apiKey", v) }) : null,
									needsKey ? (0, react_jsx_runtime.jsx)(CellInput, { label: t("rowApiKeyEnv"), placeholder: t("rowApiKeyEnv"), value: row.apiKeyEnv, disabled, onEdit: (v) => onEdit("apiKeyEnv", v) }) : null
								] }),
								(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowMaxResults"), placeholder: t("rowMaxResultsHint"), value: row.maxResults, disabled, onEdit: (v) => onEdit("maxResults", v) })
							] : [
								(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowId"), placeholder: t("rowIdHint"), value: row.id, disabled, onEdit: (v) => onEdit("id", v) }),
								(0, react_jsx_runtime.jsxs)("div", { className: "smcp_rowGrid3", children: [
									(0, react_jsx_runtime.jsx)(CellSelect, { label: t("rowKind"), options: KIND_OPTIONS, value: row.kind, disabled, onEdit: onKind }),
									(0, react_jsx_runtime.jsx)(CellSelect, { label: t("rowTransport"), options: TRANSPORT_OPTIONS, value: row.transport, disabled, onEdit: (v) => onEdit("transport", v) }),
									(0, react_jsx_runtime.jsx)(CellSelect, { label: t("rowAuthStyle"), options: AUTH_STYLE_OPTIONS, value: row.authStyle, disabled, onEdit: (v) => onEdit("authStyle", v) })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "smcp_rowGrid", children: [
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowUrl"), placeholder: t("placeholderUrl"), value: row.url, disabled, onEdit: (v) => onEdit("url", v) }),
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowApiKey"), type: "password", placeholder: t("cdKeyHint"), value: row.apiKey, disabled, onEdit: (v) => onEdit("apiKey", v) })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "smcp_rowGrid", children: [
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowApiKeyEnv"), placeholder: t("rowApiKeyEnv"), value: row.apiKeyEnv, disabled, onEdit: (v) => onEdit("apiKeyEnv", v) }),
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowAuthParam"), placeholder: t("placeholderAuthParam"), value: row.authParam, disabled, onEdit: (v) => onEdit("authParam", v) })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "smcp_rowGrid", children: [
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowCommand"), placeholder: t("placeholderCommand"), value: row.command, disabled, onEdit: (v) => onEdit("command", v) }),
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowArgs"), placeholder: t("placeholderArgs"), value: row.args, disabled, onEdit: (v) => onEdit("args", v) })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "smcp_rowGrid", children: [
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowToolName"), placeholder: t("placeholderToolName"), value: row.toolName, disabled, onEdit: (v) => onEdit("toolName", v) }),
									(0, react_jsx_runtime.jsx)(CellInput, { label: t("rowMaxResults"), placeholder: t("rowMaxResultsHint"), value: row.maxResults, disabled, onEdit: (v) => onEdit("maxResults", v) })
								] })
							]
						}) : null
					]
				});
			}

		function CellInput(props) {
			return (0, react_jsx_runtime.jsxs)("label", {
				className: "smcp_cell",
				children: [
					(0, react_jsx_runtime.jsx)("span", { className: "smcp_cellLabel", children: props.label }),
					(0, react_jsx_runtime.jsx)("input", {
						className: "smcp_input",
						type: props.type ?? "text",
						placeholder: props.placeholder,
						value: props.value,
						disabled: props.disabled,
						onChange: (e) => props.onEdit(e.target.value)
					})
				]
			});
		}
		function CellSelect(props) {
			return (0, react_jsx_runtime.jsxs)("label", {
				className: "smcp_cell",
				children: [
					(0, react_jsx_runtime.jsx)("span", { className: "smcp_cellLabel", children: props.label }),
					(0, react_jsx_runtime.jsx)("select", {
						className: "smcp_select",
						value: props.value,
						disabled: props.disabled,
						onChange: (e) => props.onEdit(e.target.value),
						children: props.options.map((option) => (0, react_jsx_runtime.jsx)("option", { value: option, children: option === "" ? "—" : option }, option))
					})
				]
			});
		}
		function TextField(props) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "smcp_field",
				children: [
					(0, react_jsx_runtime.jsx)("label", { className: "smcp_label", htmlFor: props.id, children: props.label }),
					(0, react_jsx_runtime.jsx)("input", {
						id: props.id,
						className: "smcp_input",
						type: "text",
						inputMode: props.numeric ? "numeric" : undefined,
						value: props.value,
						disabled: props.disabled,
						onChange: (e) => props.onEdit(e.target.value)
					}),
					(0, react_jsx_runtime.jsx)("p", { className: "smcp_hint", children: props.hint })
				]
			});
		}
		function SelectField(props) {
			const options = props.options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "smcp_field",
				children: [
					(0, react_jsx_runtime.jsx)("label", { className: "smcp_label", htmlFor: props.id, children: props.label }),
					(0, react_jsx_runtime.jsx)("select", {
						id: props.id,
						className: "smcp_select",
						value: props.value,
						disabled: props.disabled,
						onChange: (e) => props.onEdit(e.target.value),
						children: options.map((option) => (0, react_jsx_runtime.jsx)("option", { value: option.value, children: option.label }, option.value))
					}),
					(0, react_jsx_runtime.jsx)("p", { className: "smcp_hint", children: props.hint })
				]
			});
		}
		//#endregion


		//#region apply
		/**
		 * Hard-inject only slots + locale (same roster as netxops).
		 * Soft-inject configForms only — never settingsScope on Desktop 0.2.
		 * Do not call ctx.get("remote") in apply (waits forever and kills boot).
		 */
		const inject = ["slots", "locale"];

		function noopDescribeFace() {
			return { load: async () => {}, ensure: async () => {}, acceptView: () => {} };
		}

		function stubRemote() {
			const unavailable = { ok: false, error: { message: "凭证通道尚未就绪，请稍后重试" } };
			return {
				__stub: true,
				credentials: {
					set: async () => unavailable,
					describe: async () => unavailable,
					unset: async () => unavailable,
				},
				settings: {
					mutate: async () => unavailable,
					describe: async () => unavailable,
				},
				$on: () => () => {},
			};
		}

		/**
		 * Build a remote face from soft-injected pieces.
		 * Never call ctx.get("remote") — on Desktop 0.2 that wait freezes boot.
		 * Prefer `remote.credentials` / `remote.settings` soft-inject (netxops path).
		 */
		function buildRemoteFace(parts) {
			const credentials = parts.credentials;
			const settings = parts.settings;
			const ready = !!(credentials && typeof credentials.describe === "function"
				&& typeof credentials.set === "function");
			if (!ready && !settings) return stubRemote();
			const unavailable = { ok: false, error: { message: "凭证通道尚未就绪，请稍后重试" } };
			return {
				__stub: !ready,
				credentials: ready ? credentials : {
					set: async () => unavailable,
					describe: async () => unavailable,
					unset: async () => unavailable,
				},
				settings: settings && typeof settings.mutate === "function" ? settings : {
					mutate: async () => unavailable,
					describe: async () => (settings && typeof settings.describe === "function"
						? settings.describe()
						: unavailable),
				},
				$on: typeof parts.$on === "function" ? parts.$on : () => () => {},
			};
		}

		function pickCredentials(inner) {
			try {
				if (inner?.remote?.credentials && typeof inner.remote.credentials.describe === "function") {
					return inner.remote.credentials;
				}
			} catch { /* ignore */ }
			try {
				if (typeof inner?.get === "function") {
					// Safe: netxops uses ctx.get('remote.credentials'). Never get('remote').
					const api = inner.get("remote.credentials");
					if (api && typeof api.describe === "function") return api;
				}
			} catch { /* ignore */ }
			return null;
		}

		function pickSettings(inner) {
			try {
				if (inner?.remote?.settings && typeof inner.remote.settings.mutate === "function") {
					return inner.remote.settings;
				}
			} catch { /* ignore */ }
			try {
				if (typeof inner?.get === "function") {
					const api = inner.get("remote.settings");
					if (api && typeof api.mutate === "function") return api;
				}
			} catch { /* ignore */ }
			return null;
		}

		// Mirror cordis.patch.yml insert so the Settings form shows Bailian
		// before configForms attaches (and when the real scope is still empty).
		const MEMORY_DEFAULTS = {
			defaultServer: "bailian",
			maxResults: 8,
			searchTimeoutMs: 30000,
			servers: [
				{
					id: "bailian",
					kind: "bailian",
					apiKeyEnv: "DASHSCOPE_API_KEY",
				},
			],
		};

		function createMemoryScope(initial) {
			let value = { ...initial, servers: Array.isArray(initial.servers) ? [...initial.servers] : [] };
			let revision = 0;
			const listeners = new Set();
			const notify = () => { for (const listener of listeners) listener(); };
			return {
				__memory: true,
				getSnapshot: () => ({ status: "ready", value, writable: true, revision }),
				subscribe: (listener) => {
					listeners.add(listener);
					return () => { listeners.delete(listener); };
				},
				set: async (field, next) => {
					value = { ...value, [field]: next };
					revision += 1;
					notify();
					return true;
				},
				unset: async (field) => {
					const next = { ...value };
					delete next[field];
					value = next;
					revision += 1;
					notify();
					return true;
				},
			};
		}

		function createDeferredScope(fallback) {
			let inner = fallback;
			const outerListeners = new Set();
			let innerOff;
			const relay = () => { for (const listener of outerListeners) listener(); };
			const bindInner = () => {
				innerOff?.();
				innerOff = inner.subscribe(relay);
			};
			bindInner();
			return {
				get __memory() { return inner.__memory === true; },
				getSnapshot: () => inner.getSnapshot(),
				subscribe: (listener) => {
					outerListeners.add(listener);
					return () => { outerListeners.delete(listener); };
				},
				set: (field, next) => inner.set(field, next),
				unset: (field) => inner.unset(field),
				attach: (real) => {
					if (inner === real) return;
					inner = real;
					bindInner();
					relay();
				},
			};
		}

		function namespaceCandidates(ctx) {
			const fiber = ctx?.fiber?.entry;
			const raw = [fiber?.options?.id, fiber?.id, fiber?.options?.name, ctx?.name, NS, "dsh-search-mcp"];
			const out = [];
			for (const item of raw) {
				if (typeof item !== "string" || !item.trim()) continue;
				const id = item.replace(/^:/, "").trim();
				if (!id || out.includes(id)) continue;
				out.push(id);
			}
			if (!out.includes(NS)) out.push(NS);
			return out;
		}

		function apply(ctx) {
			try {
				ctx.effect(() => {
					try { return ctx.locale.register(LOCALE_NS, { zh, en }); }
					catch {
						try {
							const offZh = ctx.locale.register(LOCALE_NS, "zh", zh);
							const offEn = ctx.locale.register(LOCALE_NS, "en", en);
							return () => { offZh?.(); offEn?.(); };
						} catch { return () => {}; }
					}
				}, "dsh-search-mcp: locales");
			} catch { /* optional */ }

			const t = (() => {
				try { return ctx.locale.bind(LOCALE_NS); } catch { return (key) => key; }
			})();
			const sectionLabel = () => {
				try {
					const text = t("title");
					if (typeof text === "string" && text.trim() && text !== "title") return text;
				} catch { /* fall through */ }
				return "搜索 MCP";
			};

			const deferred = createDeferredScope(createMemoryScope(MEMORY_DEFAULTS));
			let controller = null;
			const remoteParts = { credentials: null, settings: null, $on: null };
			let credInjectStarted = false;
			let settingsInjectStarted = false;

			/** Soft-inject only `remote.credentials` / `remote.settings` (netxops pattern).
			 *  Do NOT inject whole `remote` — on Desktop that wait never settles. */
			const ensureRemote = () => {
				const soft = (deps, getStarted, setStarted, run, label) => {
					if (getStarted()) return;
					setStarted(true);
					try {
						ctx.inject(deps, (inner) => {
							try { run(inner); }
							catch (error) {
								inner.logger?.warn?.("dsh-search-mcp: %s handler failed: %s", label, error);
							}
						});
					} catch (error) {
						setStarted(false);
						ctx.logger?.warn?.("dsh-search-mcp: soft-inject %s skipped: %s", label, error);
					}
				};
				soft(
					["remote.credentials"],
					() => credInjectStarted,
					(v) => { credInjectStarted = v; },
					(inner) => {
						const api = pickCredentials(inner) || pickCredentials(ctx);
						remoteParts.credentials = api;
						try {
							if (inner.remote && typeof inner.remote.$on === "function") {
								remoteParts.$on = inner.remote.$on.bind(inner.remote);
							}
						} catch { /* ignore */ }
						ctx.logger?.info?.("dsh-search-mcp: remote.credentials %s", api ? "ready" : "absent");
						inner.effect(() => {
							const off = remoteParts.$on
								? remoteParts.$on("credentials/reference-updated", (ref) => {
									try {
										const used = getController().baseDraft().servers.some((row) => row.apiKeyEnv.trim() === String(ref));
										if (used) void getController().readSecretState();
									} catch { /* ignore */ }
								})
								: () => {};
							return () => {
								try { off?.(); } catch { /* ignore */ }
								remoteParts.credentials = null;
							};
						}, "dsh-search-mcp: credential invalidation");
					},
					"remote.credentials",
				);
				soft(
					["remote.settings"],
					() => settingsInjectStarted,
					(v) => { settingsInjectStarted = v; },
					(inner) => {
						remoteParts.settings = pickSettings(inner);
						ctx.logger?.info?.("dsh-search-mcp: remote.settings %s", remoteParts.settings ? "ready" : "absent");
						inner.effect(() => () => { remoteParts.settings = null; }, "dsh-search-mcp: clear settings api");
					},
					"remote.settings",
				);
			};

			const liveRemote = () => {
				// After soft-inject is live, outer ctx.get('remote.credentials') works (netxops).
				let viaGet = null;
				let settingsGet = null;
				try {
					if (typeof ctx.get === "function") {
						viaGet = pickCredentials(ctx);
						settingsGet = pickSettings(ctx);
					}
				} catch { /* ignore */ }
				try {
					if (ctx.remote && typeof ctx.remote === "object" && ctx.remote.credentials) {
						return buildRemoteFace({
							credentials: ctx.remote.credentials || viaGet || remoteParts.credentials,
							settings: ctx.remote.settings || settingsGet || remoteParts.settings,
							$on: typeof ctx.remote.$on === "function" ? ctx.remote.$on.bind(ctx.remote) : remoteParts.$on,
						});
					}
				} catch { /* ignore */ }
				return buildRemoteFace({
					credentials: viaGet || remoteParts.credentials,
					settings: settingsGet || remoteParts.settings,
					$on: remoteParts.$on,
				});
			};

			// Same deferral as configForms — never soft-inject during apply sync.
			setTimeout(() => { try { ensureRemote(); } catch { /* ignore */ } }, 0);

			const getController = () => {
				if (controller) return controller;
				try {
					controller = new SearchMcpCardController(deferred, liveRemote, noopDescribeFace());
				} catch (error) {
					ctx.logger?.warn?.("dsh-search-mcp: controller init failed: %s", error);
					controller = {
						inject: () => ({
							hooks: {
								searchMcpCard: createSnapshotStoreFallback({
									available: true, writable: false, dirty: false, invalid: false, saving: false,
									failed: false, failDetail: String(error), legacyBlocked: false, overridden: false,
									value: { defaultServer: "", maxResults: "", searchTimeoutMs: "", servers: [] },
									serverIds: [], serverKinds: {}, credentialStates: {},
								}),
							},
						}),
						baseDraft: () => ({ defaultServer: "", maxResults: "", searchTimeoutMs: "", servers: [] }),
						readSecretState: async () => {},
					};
				}
				return controller;
			};

			try {
				ctx.slots.inject("settings.section", () => {
					try {
						if (typeof SearchMcpSection !== "function") {
							throw new Error("SearchMcpSection is " + typeof SearchMcpSection);
						}
						return ctx.slots.register({
							name: "settings.section",
							// Keep distinct from host Config ns `search-mcp` — colliding ids
							// silently fail register and the Settings nav entry disappears.
							id: "dsh-search-mcp",
							order: 30,
							label: sectionLabel,
							locale: LOCALE_NS,
							inject: () => {
								try {
									ensureRemote();
									return getController().inject();
								} catch (error) {
									ctx.logger?.warn?.("dsh-search-mcp: section inject failed: %s", error);
									return {
										hooks: {
											searchMcpCard: createSnapshotStoreFallback(EMPTY_CARD_STATE),
										},
									};
								}
							},
						}, SearchMcpSection);
					} catch (error) {
						ctx.logger?.error?.("dsh-search-mcp: settings.section register failed: %s", error);
						return () => {};
					}
				});
			} catch (error) {
				ctx.logger?.warn?.("dsh-search-mcp: settings.section unavailable: %s", error);
			}

			let pluginsItemId;
			const registerPluginsItem = (id) => {
				if (pluginsItemId === id) return () => {};
				try {
					const off = ctx.slots.inject("plugins.item", () => {
						try {
							const dispose = ctx.slots.register({
								name: "plugins.item",
								id,
								order: 30,
								label: sectionLabel,
								locale: LOCALE_NS,
								inject: () => {
									try { return getController().inject(); }
									catch { return { hooks: {} }; }
								},
							}, SearchMcpSection);
							pluginsItemId = id;
							return () => {
								if (pluginsItemId === id) pluginsItemId = undefined;
								try { dispose(); } catch { /* ignore */ }
							};
						} catch { return () => {}; }
					});
					return () => {
						if (pluginsItemId === id) pluginsItemId = undefined;
						try { off(); } catch { /* ignore */ }
					};
				} catch { return () => {}; }
			};

			const tryGetForm = (forms, candidates) => {
				if (typeof forms.get !== "function") return undefined;
				for (const ns of candidates) {
					try {
						const scope = forms.get(ns);
						if (scope && typeof scope.getSnapshot === "function") return { ns, scope };
					} catch { /* next */ }
				}
				return undefined;
			};

			const attachForm = (hit, source) => {
				ctx.logger?.info?.("dsh-search-mcp: attach form via %s (%s)", source, hit.ns);
				deferred.attach(hit.scope);
				return registerPluginsItem(hit.ns);
			};

			// Same pattern as netxops — configForms soft-inject is fine with immediately:false.
						// Attach configForms by polling — soft-inject early in the Desktop
			// bundle order freezes "Loading plugins…" even with immediately:false.
			const tryAttachForms = () => {
				try {
					// IMPORTANT: never read ctx.configForms synchronously during apply —
					// on Desktop 0.2 the accessor waits and freezes "Loading plugins…".
					// This helper must only run from a deferred timer / microtask.
					const forms = ctx.configForms;
					if (!forms || typeof forms.get !== "function") return false;
					const candidates = namespaceCandidates(ctx);
					const immediate = tryGetForm(forms, candidates);
					if (immediate) {
						attachForm(immediate, "poll");
						if (typeof forms.whileServed === "function") {
							ctx.effect(() => forms.whileServed(candidates, (served) => {
								try {
									const ns = candidates.find((id) => served.has(id));
									if (!ns) return () => {};
									const hit = tryGetForm(forms, [ns, ...candidates]);
									if (!hit) return () => {};
									return attachForm(hit, "whileServed");
								} catch { return () => {}; }
							}), "dsh-search-mcp: configForms whileServed");
						}
						return true;
					}
				} catch { /* ignore */ }
				return false;
			};
			// Defer all configForms access until after apply returns.
			const startPoll = () => {
				if (tryAttachForms()) return;
				const timer = setInterval(() => {
					if (tryAttachForms()) clearInterval(timer);
				}, 1000);
				try {
					ctx.effect(() => () => clearInterval(timer), "dsh-search-mcp: configForms poll");
				} catch {
					clearInterval(timer);
				}
			};
			setTimeout(startPoll, 0);

			// Credential invalidation — only if remote already present (no get wait).
			try {
				if (ctx.remote && typeof ctx.remote.$on === "function") {
					const remote = ctx.remote;
					ctx.effect(() => remote.$on("credentials/reference-updated", (ref) => {
						try {
							const used = getController().baseDraft().servers.some((row) => row.apiKeyEnv.trim() === ref);
							if (used) getController().readSecretState();
						} catch { /* ignore */ }
					}), "dsh-search-mcp: credential status invalidation");
				}
			} catch { /* soft */ }
		}
		//#endregion
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
