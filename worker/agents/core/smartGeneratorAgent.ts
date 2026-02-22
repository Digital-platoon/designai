import { SimpleCodeGeneratorAgent } from "./simpleGeneratorAgent";
import { CodeGenState } from "./state";
import { AgentInitArgs } from "./types";

/**
 * SmartCodeGeneratorAgent - Smartly orchestrated AI-powered code generation
 * using an LLM orchestrator instead of state machine based orchestrator.
 * TODO: NOT YET IMPLEMENTED, CURRENTLY Just uses SimpleCodeGeneratorAgent
 */
export class SmartCodeGeneratorAgent extends SimpleCodeGeneratorAgent {

    /**
     * Initialize the smart code generator with project blueprint and template
     * Sets up services and begins deployment process
     */
    async initialize(
        initArgs: AgentInitArgs,
        agentMode: 'deterministic' | 'smart'
    ): Promise<CodeGenState> {
        this.logger().info('🧠 Initializing SmartCodeGeneratorAgent with enhanced AI orchestration', {
            queryLength: initArgs.query.length,
            agentType: agentMode
        });

        // Call the parent initialization
        return await super.initialize(initArgs);
    }

    async generateAllFiles(reviewCycles: number = 10): Promise<void> {
        if (this.state.agentMode === 'deterministic') {
            return super.generateAllFiles(reviewCycles);
        } else {
            return this.builderLoop();
        }
    }

    async builderLoop(): Promise<void> {
        // TODO: Implement smart LLM-orchestrated loop
        // For now, fail loudly rather than silently doing nothing
        const errorMsg = 'SmartCodeGeneratorAgent.builderLoop() is not yet implemented. Falling back to deterministic mode.';
        this.logger().warn(errorMsg);
        this.broadcast('ERROR' as any, { error: errorMsg });
        // Fall back to parent deterministic generation rather than silently exiting
        return super.generateAllFiles();
    }
}